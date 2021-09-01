<?php
namespace JDC\View\Helper;

use Laminas\View\Helper\AbstractHelper;

class JDCViewHelper extends AbstractHelper
{
    protected $api;
    protected $logger;
    protected $settings;
    protected $exiDims;
    protected $rdfDims;
    
    public function __construct($services)
    {
      $this->api = $services['api'];
      $this->logger = $services['logger'];
      $this->settings = $services['settings']->get('JDCConfigs');
      $this->exiDims = ['Physique','Actant','Concept','Rapport'];
      $this->rdfDims = ['Sujet','Objet','Predicat'];

    }


    /**
     * Cosntruction du jardin
     *
     * @param array $data
     *  
     * @return array
     */
    public function __invoke($data)
    {
      switch ($data['params']['action']) {
        case 'createDim':
          $rs = $this->createDim($data['params']);
          break;
        case 'appendDim':
          $rs = $this->appendDim($data['params']);
          break;      
        case 'removeDim':
          $rs = $this->removeDim($data['params']);
          break;      
        case 'listeDim':
          $rs = $this->listeDim($data['params']);
          break;      
        default:
          $rs = [];
          break;
      }
      return $rs;

    }

    function listeDim($params){

      $itemsDims=$this->api->search('items',['resource_class_label'=>$params['dim']])->getContent();
      $itemsAsDim = [];
      $rs = [];
      if($params['idExi']){
        $oDim = $this->api->read('items', $params['idExi'])->getContent();
        $itemsAsDim = $oDim->value('jdc:has'.$params['dim'], ['all' => true]);
      }
      foreach ($itemsDims as $dim) {
        $vDim = $this->setPropForIHM($dim);
        $vDim['isInExi']=$this->isInExi($itemsAsDim, $dim);
        $rs[]=$vDim;
      }
      return $rs;
    }

    function isInExi($listItem, $item){
        foreach ($listItem as $i) {
            if($i->id()==$item->id()) return 1;
        }
        return 0;
    }


    function appendDim($params){

      $children=false;
      $nodes=false;
      switch ($params['dim']) {
        case 'Existence':
          //récupère la définition de l'existence
          $oDim = $this->api->read('items', $params['idDim'])->getContent();
          //récupère les dimensions
          foreach ($this->exiDims as $dim) {
            $rs[$dim]['children']=$this->childrenDim($oDim,'jdc:has'.$dim);
          }
          break;
        case 'Rapport':
          $oDim = $this->addDimToExi($params);
          $nodes = $this->getRapportNodes($oDim);
          //ajoute les dimensions à l'existence si elles n'existent pas          
          break;
        default:
          $oDim = $this->addDimToExi($params);
          $children=$this->childrenDim($oDim,'jdc:has'.$params['dim']);
          break;
      }
      $vDim = $this->setPropForIHM($oDim);
      if($children)$vDim['id']['children']=$children;
      if($nodes)$vDim['nodes'] = $nodes;
      $rs[$params['dim']][]=$vDim;
      return $rs;
    }

    function getRapportNodes($oDim){
        //création des noeuds du rapport
        $nodes = [];
        foreach ($this->rdfDims as $rdf) {
          $itemsAsRdf = $oDim->value('jdc:has'.$rdf);
          $rRdf = $itemsAsRdf->valueResource();
          $nodes[]=['rdf'=>$rdf,'dim'=>$rRdf->resourceClass()->label(),'id'=>$rRdf->id()];
        }
        return $nodes;          
    }

    function addDimToExi($params){
      $oP = $this->api->search('properties', ['term' => 'jdc:has'.$params['dim']])->getContent()[0];
      $newValue[$oP->term()][]=['value_resource_id' => $params['idDim'],'property_id' => $oP->id(),'type' => 'resource'];
      $this->api->update('items', ($params['idItem'] ? $params['idItem'] : $params['idExi'])
        , $newValue, [], ['isPartial' => true,'collectionAction' => 'append']);
      return $this->api->read('items', $params['idDim'])->getContent();
    }

    function childrenDim($r, $propAs, $getChild=true){
      $children = [];
      $itemsAsDim = $r->value($propAs, ['all' => true]);
      foreach ($itemsAsDim as $iDim) {
        $rDim = $iDim->valueResource();
        $vDim = $this->setPropForIHM($rDim);
        if($getChild)$vDim['children'] = $this->childrenDim($rDim, $propAs);
        if($propAs=='jdc:hasRapport')$vDim['nodes'] = $this->getRapportNodes($rDim);
        $children[]=$vDim;
      }
      return $children;
    }
    
    function setPropForIHM($r){
      $v = $r->getJsonLd();
      $v['id'] = $r->id();
      $v['dim'] = $r->resourceClass()->label();
      $v['value'] = 1;//nécessaire pour d3.pack()
      $v['adminUrl'] = $r->adminUrl();
      $v['siteUrl'] = $r->siteUrl();
      return $v;
    }

    function removeDim($params){
        $oP = $this->api->search('properties', ['term' => 'jdc:has'.$params['dim']])->getContent()[0];
        //récupère les dimensions        
        $oDim = $this->api->read('items', $params['idExi'])->getContent();
        $newValue = json_decode(json_encode($oDim), true);
        $dims=$this->childrenDim($oDim,$oP->term(),false);
        $newValue[$oP->term()]=[];
        foreach ($dims as $d) {
          if($params['idDim']!=$d['id'])$newValue[$oP->term()][]=['value_resource_id' => $d['id'],'property_id' => $oP->id(),'type' => 'resource'];
        }        
        $this->api->update('items', $params['idExi']
          , $newValue, [], ['isPartial' => true,'collectionAction' => 'replace']);
    }

    function createDim($params){

      $oItem = [];
      $today = getdate();

      $rt = $this->api->search('resource_templates', ['label' => 'JDC '.$params['dim']])->getContent()[0];
      $rc = $this->api->search('resource_classes', ['term' => 'jdc:'.$params['dim']])->getContent()[0];

      $oItem = $this->setData($params['data'], $rt, $rc);

      $oDim = $this->api->create('items', $oItem, [], ['continueOnError' => false])->getContent();

      //création de la relation
      if($params['idExi']){
        $params['idItem']=$params['idExi'];
        $params['idDim']=$oDim->id();
        $rs = $this->appendDim($params);
      }else{
        $rs['Existence'][] = $this->setPropForIHM($oDim);
        foreach ($this->exiDims as $dim) {
          $rs[$dim]['children']=[];
        }
      }

      return $rs;

    }


    /** Construction des data pour l'API
     *
     * @param array $data
     * @param object $rt
     * @param object $rc
     * @return  array
     */
    protected function setData($data, $rt, $rc)
    {
        $oItem = [];
        $oItem['o:resource_class'] = ['o:id' => $rc->id()];
        $oItem['o:resource_template'] = ['o:id' => $rt->id()];
        foreach ($rt->resourceTemplateProperties() as $p) {
            $oP = $p->property();
            if (isset($data[$oP->term()])) {
                $val = $data[$oP->term()];
                $oItem = $this->setValeur($val, $oP, $oItem);
            }
        }
        return $oItem;

    }

    /** Construction de la valeur
     *
     * @param array $val
     * @param object $oP
     * @param array $oItem
     * @return  array
     */
    protected function setValeur($val, $oP, $oItem)
    {
        if (is_string($val)) $val = [$val];
        foreach ($val as $v) {
            $valueObject = [];
            if (!is_string($v) && $v['value']) {
                $valueObject['value_resource_id'] = $v['value'];
                $valueObject['property_id'] = $oP->id();
                $valueObject['type'] = 'resource';
            } else {
                $valueObject['@value'] = $v;
                $valueObject['type'] = 'literal';
                $valueObject['property_id'] = $oP->id();
            }
            $oItem[$oP->term()][] = $valueObject;
        }
        return $oItem;
    }

}
