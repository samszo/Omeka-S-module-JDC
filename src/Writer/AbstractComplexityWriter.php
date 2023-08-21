<?php declare(strict_types=1);

namespace BulkExport\Writer;

use BulkExport\Traits\ListTermsTrait;
use BulkExport\Traits\MetadataToStringTrait;
use BulkExport\Traits\ResourceFieldsTrait;
use Omeka\Api\Representation\AbstractResourceEntityRepresentation;

abstract class AbstractComplexityWriter extends AbstractWriter
{
    use ListTermsTrait;
    use MetadataToStringTrait;
    use ResourceFieldsTrait;

    /**
     * Limit for the loop to avoid heavy sql requests.
     *
     * @var int
     */
    const SQL_LIMIT = 100;
    
    protected $label = "Complexity Writer";

    protected $configKeys = [
        'dirpath',
        'filebase',
        'format_fields',
        'format_generic',
        'format_resource',
        'format_resource_property',
        'format_uri',
        'language',
        'resource_types',
        'metadata',
        'metadata_exclude',
        // Keep query in the config to simplify regular export.
        'query',
    ];

    protected $paramsKeys = [
        'dirpath',
        'filebase',
        'format_fields',
        'format_generic',
        'format_resource',
        'format_resource_property',
        'format_uri',
        'language',
        'resource_types',
        'metadata',
        'metadata_exclude',
        'query',
    ];

    protected $options = [
        'dirpath' => null,
        'filebase' => null,
        'resource_type' => null,
        'resource_types' => [],
        'metadata' => [],
        'metadata_exclude' => [],
        'format_fields' => 'name',
        'format_generic' => 'raw',
        'format_resource' => 'url_title',
        'format_resource_property' => 'dcterms:identifier',
        'format_uri' => 'uri_label',
        'language' => '',
        'only_first' => false,
        'empty_fields' => false,
        'query' => [],
    ];

    /**
     * Json resource types.
     *
     * @var array
     */
    protected $resourceTypes = [];

    /**
     * @var array
     */
    protected $stats;

    /**
     * @var bool
     */
    protected $jobIsStopped = false;

    /**
     * @var bool
     */
    protected $hasError = false;

    /**
     * @var bool
     */
    protected $prependFieldNames = false;

    /**
     * @var array
     */
    protected $keys = false;
    /**
     * @var array
     */
    protected $rs = false;
    /**
     * @var array
     */
    protected $data = [];
    protected $querySQL;
    protected $jdc;

    /**
     * @var \Laminas\Mvc\I18n\Translator
     */
    protected $translator;

    public function process(): self
    {
        $this->translator = $this->getServiceLocator()->get('MvcTranslator');

        $this
            ->initializeParams()
            ->prepareTempFile()
            ->initializeOutput();

        if ($this->hasError) {
            return $this;
        }

        $this
            ->prepareFieldNames($this->options['metadata'], $this->options['metadata_exclude']);

        if (!count($this->fieldNames)) {
            $this->logger->warn('No headers are used in any resources.'); // @translate
            $this
                ->finalizeOutput()
                ->saveFile();
            return $this;
        }

        if ($this->prependFieldNames) {
            if (isset($this->options['format_fields']) && $this->options['format_fields'] === 'label') {
                $this->prepareFieldLabels();
                $this->writeFields($this->fieldLabels);
            } else {
                $this->writeFields($this->fieldNames);
            }
        }

        $this->stats = [];
        $this->logger->info(
            '{number} different fields are used in all resources.', // @translate
            ['number' => count($this->fieldNames)]
        );

        $this->appendResources();

        $this
            ->finalizeOutput()
            ->saveFile();
        return $this;
    }

    protected function initializeParams(): self
    {
        // Merge params for simplicity.
        $this->options = $this->getParams() + $this->options;

        if (!in_array($this->options['format_resource'], ['identifier', 'identifier_id'])) {
            $this->options['format_resource_property'] = null;
        }

        $query = $this->options['query'];
        if (!is_array($query)) {
            $queryArray = [];
            parse_str((string) $query, $queryArray);
            $query = $queryArray;
            $this->options['query'] = $query;
        }

        return $this;
    }

    protected function initializeOutput(): self
    {
        return $this;
    }

    /**
     * @param array $fields If fields contains arrays, this method should manage
     * them.
     */
    abstract protected function writeFields(array $fields): self;

    protected function finalizeOutput(): self
    {
        return $this;
    }

    protected function appendResources(): self
    {
        $vhm = $this->getServiceLocator()->get('ViewHelperManager');
        $this->querySQL = $vhm->get('QuerySqlFactory');
        $this->jdc = $vhm->get('JDCFactory');

        $this->stats['totals'] = 0;
        $this->stats['totalToProcess'] = $this->countResources();
        $this->stats['processed'] = 0;
        $this->stats['succeed'] = 0;
        $this->stats['skipped'] = 0;

        if (!$this->stats['totalToProcess']) {
            $this->logger->warn('No resource to export.'); // @translate
            return $this;
        }

        //initialise le tableau des résultats
        $exiDims = $this->jdc->getExiDims();
        foreach ($exiDims as $d) {
            $this->rs[$d]=[];
        }

        foreach ($this->options['resource_types'] as $resourceType) {
            if ($this->jobIsStopped) {
                break;
            }
            $this->appendResourcesForResourceType($resourceType);
        }
        $this->logger->info(
            '{processed}/{total} processed, {succeed} succeed, {skipped} skipped.', // @translate
            ['processed' => $this->stats['processed'], 'total' => $this->stats['totals'], 'succeed' => $this->stats['succeed'], 'skipped' => $this->stats['skipped']]
        );
        $this->writeFields($this->rs);

        return $this;
    }


    protected function appendResourcesForResourceType($resourceType): self
    {
        $apiResource = $this->mapResourceTypeToApiResource($resourceType);
        $resourceText = $this->mapResourceTypeToText($resourceType);

        /**
         * @var \Doctrine\ORM\EntityManager $entityManager
         * @var \Doctrine\DBAL\Connection $connection
         * @var \Doctrine\ORM\EntityRepository $repository
         * @var \Omeka\Api\Adapter\ItemAdapter $adapter
         * @var \Omeka\Api\Manager $api
         */
        $services = $this->getServiceLocator();
        $entityManager = $services->get('Omeka\EntityManager');
        $adapter = $services->get('Omeka\ApiAdapterManager')->get($apiResource);
        $api = $services->get('Omeka\ApiManager');

        $this->stats['process'][$resourceType] = [];
        $this->stats['process'][$resourceType]['total'] = $this->stats['totals'][$resourceType];
        $this->stats['process'][$resourceType]['processed'] = 0;
        $this->stats['process'][$resourceType]['succeed'] = 0;
        $this->stats['process'][$resourceType]['skipped'] = 0;
        $statistics = &$this->stats['process'][$resourceType];

        $this->logger->notice(
            'Starting export of {total} {resource_type}.', // @translate
            ['total' => $statistics['total'], 'resource_type' => $resourceText]
        );

        // Avoid an issue when the query contains a page: there should not be
        // pagination at this point. Page and limit cannot be mixed.
        // @see \Omeka\Api\Adapter\AbstractEntityAdapter::limitQuery().
        unset($this->options['query']['page']);
        unset($this->options['query']['per_page']);

        if ($this->job->shouldStop()) {
            $this->jobIsStopped = true;
            $this->logger->warn(
                'The job "Export" was stopped: {processed}/{total} resources processed.', // @translate
                ['processed' => $statistics['processed'], 'total' => $statistics['total']]
            );
            return $this;
        }

        $response = $api
            // Some modules manage some arguments, so keep initialize.
            ->search($apiResource, $this->options['query'], ['responseContent' => 'reference']);

        /** @var \Omeka\Api\Representation\AbstractResourceEntityRepresentation[] $resources */
        $ids = $response->getContent();
        if (!count($ids)) {
            return $this;
        }

        foreach ($ids as $r) {
            $id = $r->id();
            if ($id) {
                //récupère les usages des resources
                $this->data = $this->querySQL->__invoke([
                    'id'=>$id,
                    'action'=>'statResUsed']);

                $this->stats['totals'] += count($this->data);
                $this->logger->notice(
                    'Starting export of {total}.', // @translate
                    ['total' => $this->stats['totals']]
                );

                foreach ($this->data as $i=>$d) {
                    if ($this->job->shouldStop()) {
                        $this->jobIsStopped = true;
                        $this->logger->warn(
                            'The job "Export" was stopped: {processed}/{total} resources processed.', // @translate
                            ['processed' => $this->stats['processed'], 'total' => $this->stats['totals']]
                        );
                        break;
                    }
                    $this->setComplexityResLink($d,1);
                    ++$this->stats['processed'];  
                    $this->logger->info(
                        '{processed}/{total} => {totals} : {id}.', // @translate
                        ['processed' => $this->stats['processed'], 'total' => $this->stats['totalToProcess'], 'totals' => $this->stats['totals'], 'id' => $d['id']]
                    );
            
                }                    
                // Avoid memory issue.
                unset($r);

                ++$statistics['succeed'];
            } else {
                ++$statistics['skipped'];
            }

            // Processed = $offset + $key.
            ++$statistics['processed'];
        }

        $this->logger->info(
            '{processed}/{total} {resource_type} processed, {succeed} succeed, {skipped} skipped.', // @translate
            ['resource_type' => $resourceText, 'processed' => $statistics['processed'], 'total' => $statistics['total'], 'succeed' => $statistics['succeed'], 'skipped' => $statistics['skipped']]
        );

        // Avoid memory issue.
        unset($ids);
        $entityManager->clear();

        $this->logger->notice(
            '{processed}/{total} {resource_type} processed, {succeed} succeed, {skipped} skipped.', // @translate
            ['resource_type' => $resourceText, 'processed' => $statistics['processed'], 'total' => $statistics['total'], 'succeed' => $statistics['succeed'], 'skipped' => $statistics['skipped']]
        );

        $this->logger->notice(
            'End export of {total} {resource_type}.', // @translate
            ['total' => $statistics['total'], 'resource_type' => $resourceText]
        );

        return $this;
    }


  
      /** calcule la complexité des ressources liées
      *
      * @param array  $r stats de la ressource
      * @param string $d dimension existentielle
      * @param int    $n niveau du lien
      * @param array  $db liste des ressources traitées pour éviter les boucles infinies
  
      * @return array
      */
      function setComplexityResLink($r,$n,$db=[]){
        //$this->logger->info("setComplexityResLink = ".$r['id'].' - '.$n);
  
        if($db[$r['id']])return;
        $d = $this->jdc->mapClassToDimension($r);
        if(!isset($this->rs[$d]))$this->rs[$d]=[1=>0];
        if(!isset($this->rs[$d][$n]))$this->rs[$d][$n]=0;
        $this->rs[$d][$n]++;
        if($r["nbRes"]){
          $db[$r['id']]=1;
          //récupère les ressources
          $rs = explode(',',$r["idsRes"]);
          $ps = explode(',',$r["propsRes"]);
          if(count($rs)!=count($ps)){
            throw new \Omeka\Job\Exception\InvalidArgumentException("Les propriétés ne correspondent pas aux ressources : "+r['id']); // @translate
          }
          foreach ($rs as $i=>$id) {
            if($this->keys){
              $k = array_search($id, $this->keys);
              $ni = $k ? $this->data[$k] : false;
            }else{
              $k = $this->querySQL->__invoke([
                'id'=>$id,
                'action'=>'statResUsed']);
              $ni = $k[0];
            }
            if($ni){
              //ajoute les rapports
              $keyRapport = $n.'_'.$d.'_'.$this->jdc->mapClassToDimension($ni).'_'.$ps[$i];
              if(!isset($this->rs['Rapport'][$keyRapport]))
                $this->rs['Rapport'][$keyRapport]=0;
              $this->rs['Rapport'][$keyRapport]++;
              $this->setComplexityResLink($ni,$n+1,$db);
            }else{
              throw new \Omeka\Job\Exception\InvalidArgumentException("La ressource n'est pas trouvée : "+r['id']); // @translate
            }
          }
        }
        if($r["nbUri"]){
          $this->rs[$d][1]+=$r["nbUri"];
          //TODO:ajouter le poids de l'uri suivant les liens dans la page Web
        }
        ++$this->stats['totals'];  
      }        


    protected function countResources(): array
    {
        /** @var \Omeka\Api\Manager $api */
        $api = $this->getServiceLocator()->get('Omeka\ApiManager');
        $result = [];
        $result['total']=0;
        foreach ($this->options['resource_types'] as $resourceType) {
            $resource = $this->mapResourceTypeToApiResource($resourceType);
            $result[$resourceType] = $resource
                // Some modules manage some arguments, so keep initialize.
                ? $api->search($resource, ['limit' => 0] + $this->options['query'], ['finalize' => false])->getTotalResults()
                : 0;
            $result['total']+=$result[$resourceType];    
        }
        return $result;
    }
}
