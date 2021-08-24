<?php
namespace JDC\View\Helper;

use Laminas\View\Helper\AbstractHelper;

class JDCViewHelper extends AbstractHelper
{
    protected $api;
    protected $logger;
    protected $settings;
    protected $exiDims;
    
    public function __construct($services)
    {
      $this->api = $services['api'];
      $this->logger = $services['logger'];
      $this->settings = $services['settings']->get('JDCConfigs');
      $this->exiDims = ['Physique','Actant','Concept','Rapport'];

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
        default:
          $rs = [];
          break;
      }
      return $rs;

    }

    function appendDim($params){
      if($params['dim']=="Existence"){
        //récupère la définition de l'existence
        $oDim = $this->api->read('items', $params['idDim'])->getContent();
        //récupère les dimensions
        foreach ($this->exiDims as $dim) {
          $rs[$dim]['children']=$this->childrenDim($oDim,'jdc:has'.$dim);
        }
        $children=false;
      }else{
        $oP = $this->api->search('properties', ['term' => 'jdc:has'.$params['dim']])->getContent()[0];
        $newValue[$oP->term()][]=['value_resource_id' => $params['idDim'],'property_id' => $oP->id(),'type' => 'resource'];
        $this->api->update('items', ($params['idItem'] ? $params['idItem'] : $params['idExi'])
          , $newValue, [], ['isPartial' => true,'collectionAction' => 'append']);
        $oDim = $this->api->read('items', $params['idDim'])->getContent();
        $children=$this->childrenDim($oDim,'jdc:has'.$params['idDim']);
      }
      $vDim = $oDim->getJsonLd();
      $vDim['id'] = $oDim->id();
      $vDim['value'] = 1;//nécessaire pour d3.pack()
      if($children)$vDim['id']['children']=$children;
      $rs[$params['dim']][]=$vDim;
      return $rs;
    }

    function childrenDim($r, $propAs, $getChild=true){
      $children = [];
      $itemsAsDim = $r->value($propAs, ['all' => true]);
      foreach ($itemsAsDim as $iDim) {
        $rDim = $iDim->valueResource();
        $vDim = $rDim->getJsonLd();//json_decode(json_encode($rDim),true)
        if($getChild)$vDim['children'] = $this->childrenDim($rDim, $propAs);
        $vDim['id'] = $rDim->id();
        $vDim['value'] = 1;//nécessaire pour d3.pack()
        $children[]=$vDim;
      }
      return $children;
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

      $rs = $this->api->create('items', $oItem, [], ['continueOnError' => false])->getContent();

      //création de la relation
      if($params['idExi']){
        $params['id']=$params['idExi'];
        $params['idDim']=$rs->id();
        $rs = $this->appendDim($params);
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
