<?php
namespace JDC\View\Helper;

use Laminas\View\Helper\AbstractHelper;

class JDCViewHelper extends AbstractHelper
{
    protected $api;
    protected $cnx;
    protected $logger;
    protected $settings;
    protected $querySql;
    protected $exiDims;
    protected $rdfDims;
    protected $classToDim;
    protected $propsRelations;
    protected $props;
    protected $rcs;
    protected $skosRapports;
    var $doublons=[];
    var $nivMax=2;//profondeur de la recherche
    var $addResource=true;//ajoute ou non les ressources
    var $querySemanticPositionSource;
    var $querySemanticPositionTarget;
    var $deb;
    var $fin;
    var $rs;
    var $data;
    var $keys;
    var $stats;

    public function __construct($services)
    {
      $this->api = $services['api'];
      $this->cnx = $services['cnx'];
      $this->logger = $services['logger'];
      $this->settings = $services['settings']->get('JDCConfigs');
      $this->querySql = $services['querySql'];
      $this->exiDims = ['Physique','Actant','Concept','Rapport'];
      $this->rdfDims = ['Sujet','Objet','Predicat'];
      $this->classToDim = [
        'Article'=>'Physique',
        'Academic Article'=>'Physique',
        'Book'=>'Physique',
        'Book Section'=>'Physique',
        'Project'=>'Physique',
        'Thesis'=>'Physique',
        'Webpage'=>'Physique',
        'Report'=>'Physique',
        'Document'=>'Physique',
        'Slideshow'=>'Physique',
        'Event'=>'Physique',
        ''=>'Physique',
        'ItemSet'=>'Physique',
        'Media'=>'Physique',
        'audio-visual document'=>'Physique',
        'Manuscript'=>'Physique',
        'Chapter'=>'Physique',
        'Parcours'=>'Concept',
        'citation'=>'Physique',
        'Note'=>'Physique',
        'Person'=>'Actant',
        'Person'=>'Actant',
        'Actant'=>'Actant',
        'Interactive Resource'=>'Physique',
        'Mention'=>'Concept',
        'audio document'=>'Physique',
        'Annotation'=>'Physique',
        'Concept'=>'Concept',
        'Département'=>'Physique',
        'Organization'=>'Actant',
        'Periodical'=>'Physique',
        'Élément constitutif'=>'Concept',
        'Unité de Formation et de Recherche'=>'Actant',
        'Ecole Doctorale'=>'Actant',
        'Hospital'=>'Actant',
        'Laboratoire'=>'Actant',
        'Library'=>'Actant',
        'School'=>'Actant',
        'Université'=>'Actant'
      ];
      $this->props = [];
      $this->rcs = [];
      $this->skosRapports = [];
      $this->propsRelations=[];

    }


    /**
     * Construction du jardin
     *
     * @param array $data
     *  
     * @return array
     */
    public function __invoke($data)
    {
      if(!isset($data['params']['action']))return [];
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
        case 'createDimTxtAsso':
          $rs = $this->createDimTxtAsso($data['params']);
          break;   
        case 'getReseauConceptAll':
          $rs = $this->getReseauConceptAll();//très très gourmand, utiliser : CartoAffect\View\Helper\QuerySqlViewHelper::statValueResourceClass
          break;                  
        case 'getReseauConcept':
          $rs = $this->getReseauConcept($data['params']);
          break;                  
        case 'createSkosRapports':
          $rs = $this->createSkosRapports($data['params']);
          break;                  
        case 'generer':
          $rs = $this->generer($data['params']);
          break;                  
        case 'getComplexity':
          $rs = $this->getComplexity($data);
          break;                  
        default:
          $rs = [];
          break;
      }
      return $rs;

    }

    public function getExiDims(){
      return $this->exiDims;
    }
    public function getStats(){
      return $this->stats;
    }
    public function setStats($stats){
      $this->stats=$stats;
    }
    public function getRs(){
      return $this->rs;
    }
    public function setRs($rs){
      $this->rs=$rs;
    }
    public function initRs(){
        //initialise le tableau des résultats
        foreach ($this->exiDims as $d) {
            $this->rs[$d]=[];
        }
        $this->rs['infos']=[
          "date"=>date(DATE_ATOM),
          "resources"=>[]
        ];
        return $this->rs;
    }

    /** calcule la complexité d'une ressource 
     *
     * @param array   $params
     * @param array   $db
     * @return array
     */
    function getComplexity($params,$db=[]){
      $this->logger->info("complexity START");
      try {
        if(!$db){
          set_time_limit(3600);
        }

        //récupère les usages des resources
        $ids = [];
        if($params["params"]["property"]){
          $q = $params["params"];
          unset($q['json']);
          unset($q['id']);
          unset($q['helper']);
          unset($q["nivMax"]);          
          $arrR= ["items","media","item_sets","annotations"];
          foreach ($arrR as $apiResource) {
            $response = $this->api->search($apiResource, $q, ['responseContent' => 'reference']);
            $rs = $response->getContent();
            foreach ($rs as $r) {
              $ids[]=$r->id();
            }
          }
          if (!count($ids)) throw new \Omeka\Job\Exception\InvalidArgumentException("query is not goog"); // @translate  
        }        
        $this->data = $this->querySql->__invoke([
          'id'=>$params["params"]["id"],
          'ids'=>$ids,
          'action'=>'statResUsed']);
        $this->logger->info("Data received = ".count($this->data));
        //récupère les clefs dans le cas de la complexité totale
        if(!$params["params"]["id"] && !count($ids))
          $this->keys = array_column($this->data, 'id');
        else{
          $this->keys = false;
        }  
        //
        $this->nivMax = isset($params["params"]["nivMax"]) ? $params["params"]["nivMax"] : 1000;
        //initialise le tableau des résultats
        $this->initRs();
        $this->rs['infos']['params']=$params["params"];
        //calcul la complexité de l'ensemble des ressources
        foreach ($this->data as $i=>$r) {
          $this->setComplexityResource($r,1);
        }
        $c = $this->setComplexity($db);        
      } catch (\Exception $e) {
        throw new \Omeka\Job\Exception\InvalidArgumentException($e->getMessage()); // @translate
      }          
      $this->logger->info("complexity END");
      return $c;
    }
    public function mapClassToDimension($r){
      $d = $this->classToDim[$r["class label"]];
      if(!$d)$d="Physique";
      return $d;      
    }

    /** calcule la complexité
    * @param array   $db
    * @return array
    */
    public function setComplexity($db=[]){
      //ini_set('memory_limit', '2G');  
      $c = [
        "infos"=>$this->rs['infos'],
      ];
      //calcule la complexité pour chaque dimension et au total
      $cT = 0;
      $nbT = 0;
      $nbTN = 0;
      $nTMin = 100000;
      $nTMax = 0;
      foreach ($this->exiDims as $d) {
          $c[$d]=[];
          $cd = 0;
          $nbD = 0;
          $nbN = 0;
          $nMin = 100000;
          $nMax = 0;
          $c[$d]['details']=[];
          if($d=='Rapport'){            
            foreach ($this->rs['Rapport'] as $k=>$r) {
              $a = explode('_',$k);
              $c["Rapport"]['details'][]=['ns'=>intval($a[0]),'no'=>intval($a[1]),'s'=>$a[2],'o'=>$a[3],'p'=>$a[4],'nb'=>$r,'c'=>$r*$a[0]];
              $cd += $r*$a[0];
              $nbD += $r;
              $nbN ++;
              $nMin = $nMin < $a[0] ? $nMin : $a[0];  
              $nMax = $nMax > $a[0] ? $nMax : $a[0];  
            }      
          }else{
            foreach ($this->rs[$d] as $k=>$r) {
              $c[$d]['details'][]=['n'=>$k,'nb'=>$r,'c'=>$r*$k];
              $cd += $r*$k;
              $nbD += $r;
              $nbN ++;
              $nMin = $nMin < $k ? $nMin : $k;  
              $nMax = $nMax > $k ? $nMax : $k;  
            }      
          }
          $c[$d]['totals']=['nbNiv'=>$nbN,'nivMin'=>$nMin,'nivMax'=>$nMax,'nb'=>$nbD, 'c'=>$cd];
          $cT += $cd;
          $nbT += $nbD;
          $nbTN += $nbN;
          $nTMin = $nTMin < $nMin ? $nTMin : $nMin;
          $nTMax = $nTMax > $nMax ? $nTMax : $nMax;      
      }
      $c['totals']=['nbNiv'=>$nbTN,'nivMin'=>intval($nTMin),'nivMax'=>$nTMax,'nb'=>$nbT, 'c'=>$cT];

      //calcule la complexité de chaque ressource une seule fois
      if(!$db && $this->addResource){
        foreach ($c['infos']['resources'] as $r) {
          /*ATTENTION : pour des raisons de performance
          on ne prend pas en compte 
          les ressources qui ne sont des valeurs de propriété
          = on ne calcule pas la complexité des "Linked resources"
          */  
          $db[$r['id']]=1;
          if($db[$r['id']] < 2 && $r['isValue']){
            $db[$r['id']]=2;
            $p = ['params'=>['id'=>$r['id']]];
            $cx = $this->getComplexity($p,$db);
            $c['infos']["resources"][$this->doublons[$r['id']]]['ic']=$cx['totals']['c'];
            $c['infos']["resources"][$this->doublons[$r['id']]]['c']=$cx;
            // Avoid memory issue.
            unset($cx);
            //unset($this->rs);
          }else{
            if(!$c['infos']["resources"][$this->doublons[$r['id']]]['ic'])
              $c['infos']["resources"][$this->doublons[$r['id']]]['ic']='no';
            if(!$c['infos']["resources"][$this->doublons[$r['id']]]['c'])
              $c['infos']["resources"][$this->doublons[$r['id']]]['c']='no';
          }
        }  
      }
      //
      return $c;
    }
    protected function mapResourceSQLToApi($resourceSQL): ?string
    {
        $mapping = [
            "Omeka\Entity\Item"=>"items",
            "Omeka\Entity\Media"=>"media",
            "Omeka\Entity\ItemSet"=>"item_sets",
            // Modules.
            "Annotate\Entity\Annotation"=>"annotations",
        ];
        return $mapping[$resourceSQL];
    }

    public function setComplexityResource($r,$n,$db=[]){
      //$this->logger->info("setComplexityResource = ".$r['id'].' - '.$n);

      //vérifie les boucles sans fin = ressource enfant lié à une ressource parent 
      if($db[$r['id']])return;

      //incrémente la dimension de la classe de la ressource
      $d = $this->mapClassToDimension($r);
      
      //on ajoute les données de la resource
      $this->addDataToResource($r,$d,$n);

      if($d=='Rapport')$this->incrementeRapport($n.'_'.$n.'_'.$d.'_Physique_'.$r["class label"],1);
      else {
        if(!isset($this->rs[$d]))$this->rs[$d]=[1=>0];
        if(!isset($this->rs[$d][$n]))$this->rs[$d][$n]=0;
        $this->rs[$d][$n]++;
      }

      //calcule la complexité des propriétés
      //incrémente les concepts = propriété
      $this->rs['Concept'][($n)]+=$r["nbProp"];
      //incrémente les physiques = valeur
      $this->rs['Physique'][($n)]+=$r["nbVal"];
      //incrémente les rapports
      $this->incrementeRapport($n.'_'.$n.'_'.$d.'_Concept'.'_properties',$r["nbProp"]);
      $this->incrementeRapport($n.'_'.$n.'_'.$d.'_Physique'.'_values',$r["nbVal"]);

      //calcule la complexité des owners
      if($r["nbOwner"]){
        //récupère les ressources
        $rs = explode(',',$r["idsOwner"]);
        foreach ($rs as $i=>$id) {
          if(!$db['owner'.$id]){
            $db['owner'.$id]=1;
            //ajoute les rapports
            $this->rs['Actant'][1]++;
            $this->incrementeRapport('1_'.$n.$d.'_Actant_Physique_owner',1);
          }
        }
      }

      //calcule les rapports des ressources ayant comme valeur 
      //la ressource en coursde niveau 1
      if($n==1){
        $rsL = $this->querySql->__invoke([
          'vrid'=>$r['id'],
          'action'=>'statResUsed']);
        foreach ($rsL as $l) {
          if(!$db[$l['id']]){
            $db[$l['id']]=1;
            //ajoute la complexité de la resource liées
            $dl = $this->mapClassToDimension($l);
            $this->rs[$dl][($n+1)]+=1;
            //ajoute les rapports
            $this->incrementeRapport(($n+1).'_'.($n).'_'.$dl.'_'.$d.'_'.$l['propsRes'],1);
            //ATTENTION : ne pas faire pour éviter le calcul de la base entière
            //calcule la complexité de la ressource liés
            //if($this->nivMax > $n)$this->setComplexityResource($ni,$n+1,$db);
            //on ajoute les données de la resource
            if($this->addResource)$this->addDataToResource($l,$dl,$n+1,false);            
          }
        }  
      }


      //calcule les rapports des ressources liées
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
            $k = $this->querySql->__invoke([
              'id'=>$id,
              'action'=>'statResUsed']);
            $ni = $k[0];
          }
          if($ni){
            //ajoute les rapports
            $this->incrementeRapport($n.'_'.($n+1).'_'.$d.'_'.$this->mapClassToDimension($ni).'_'.$ps[$i],1);
            //calcule la complexité de la ressource liés
            if($this->nivMax > $n)$this->setComplexityResource($ni,$n+1,$db);
          }else{
            throw new \Omeka\Job\Exception\InvalidArgumentException("La ressource n'est pas trouvée : "+$r['id']); // @translate
          }
        }
      }      

      //calcule les rapports des uri
      if($r["nbUri"]){
        $this->incrementeRapport($n.'_'.$n.'_'.$d.'_Physique'.'_uri',$r["nbUri"]);
        //TODO:ajouter le poids de l'uri suivant les liens dans la page Web
      }

      ++$this->stats['totals'];  
      return $this->rs;
    }     

    function addDataToResource($r,$d,$n,$isValue=true){
      //on ajoute les données de la resource
      if(!$this->doublons[$r['id']]){
        $this->doublons[$r['id']] = count($this->rs['infos']["resources"]);
        $o = $this->mapResourceSQLToApi($r['resource_type']);
        $ro = $this->api->read($o, $r['id'])->getContent();
        $this->rs['infos']["resources"][]=['type'=>$o,'id'=>$r['id'],'title'=>$ro->displayTitle()
          ,'d'=>$d,'n'=>[$n],'isValue'=>$isValue];
      }else{
        $this->rs['infos']["resources"][$this->doublons[$r['id']]]['n'][]=$n;
      } 
    }

    function incrementeRapport($k,$v){
      if(!isset($this->rs['Rapport'][$k]))$this->rs['Rapport'][$k]=0;
      $this->rs['Rapport'][$k]+=$v;
    }

    function generer($params){
      if (class_exists(\Generateur\Generateur\Moteur::class)) {
                
        //création du moteur de génération
        $m = new \Generateur\Generateur\Moteur(true,$this->api,isset($params['log']) ? $params['log'] : false,$this->cnx);
        $gen = $m->genereExiJDC($params);
        return $this->getGeneration($gen);
      }else{
        throw new \Omeka\Job\Exception\InvalidArgumentException("Le module Générateur n'est pas installé."); // @translate
      }
    }

    function getGeneration($gen){
      //vérifie l'existence d'une génératiuon équivalente
      $param = array();
      $param['property'][0]['property']= $this->getProp('bibo:content')->id();
      $param['property'][0]['type']='eq';
      $param['property'][0]['text']=$gen['data']['bibo:content'][0]['@value']; 
      $existe = $this->api->search('generations',$param)->getContent();
      if(count($existe)){
        $oGen = $existe[0]; 
      }else{
        $valueObject = [];
        $valueObject['@value'] = "Génération ".uniqid();
        $valueObject['type'] = 'literal';
        $valueObject['property_id']=$this->getProp('dcterms:title')->id();
        $gen['data']['dcterms:title'][] = $valueObject;    
        $gen['data']['o:resource'] = ['o:id'=>$gen['exi']->id()];      
        $oGen = $this->api->create('generations', $gen['data']);
      }
      return $oGen;
    }

    function createSkosRapports($params){
      //récupère le concept
      $concept = $this->api->read('items', $params['id'])->getContent();

      //récupère l'actant
      if(isset($params['actant'])) $actant = $this->api->read('items', $params['actant']['o:id'])->getContent();
      else{
        //récupère l'utilisateur
        $user = $this->api->read('users', $params['user']['id'])->getContent();
        $userUri = 'http://'.$_SERVER['SERVER_NAME'].str_replace(['item',$concept->id()],['user',$user->id()],$concept->adminUrl());
        $actant = $this->ajouteActant($user,$userUri);
      }
      //ajoute les positions sémantiques
      $position = $this->ajouteSemanticPosition($actant, $concept, $params);        

      return $this->getReseauConcept($params);

    }

    /** Ajoute une position sémantique
     *
     * @param o:item  $this->actant
     * @param o:item  $concept
     * @param array   $rapports
     * @return o:item
     */
    protected function ajouteSemanticPosition($actant, $concept, $data)
    {

      $ref = "SemanticPosition:".$data['rt']." = ".$concept->id()."-".$actant->id();
      $rt =  $this->api->read('resource_templates', ['label' => $data['rt']])->getContent();
      $rc =  $this->getRc('jdc:SemanticPosition');
      $pIRB =  $this->getProp('dcterms:isReferencedBy');
      //création ou mise à jour
      $param = array();
      $param['property'][0]['property']= $pIRB->id()."";
      $param['property'][0]['type']='eq';
      $param['property'][0]['text']=$ref; 
      $existe = $this->api->search('items',$param)->getContent();
      $bExiste = count($existe);
      $oItem = [];
      if(!$bExiste){
        $oItem['o:resource_class'] = ['o:id' => $rc->id()];
        $oItem['o:resource_template'] = ['o:id' => $rt->id()];
        foreach ($rt->resourceTemplateProperties() as $p) {
          $oP = $p->property();
          switch ($oP->term()) {
            case 'dcterms:isReferencedBy':
              $valueObject = [];
              $valueObject['@value'] = $ref;
              $valueObject['type'] = 'literal';
              $valueObject['property_id']=$oP->id();
              $oItem[$oP->term()][] = $valueObject; 
              break;            
            case 'dcterms:title':
              $titre = "Position sémantique ".$data['rt']
                ." « ".$concept->displayTitle()." » ";
              foreach ($data['rapports'] as $r) {
                $oP =  $this->getProp($r['rapport']['term']);
                $titre .= " avec '".$oP->label()."' = '".$r['label']."'";
              }                
              $titre .= " » par ".$actant->displayTitle();
              $valueObject = [];
              $valueObject['@value'] = $titre;
              $valueObject['type'] = 'literal';
              $valueObject['property_id']=$oP->id();
              $oItem[$oP->term()][] = $valueObject;    
              break;            
            case 'dcterms:creator':
              $valueObject = [];
              $valueObject['value_resource_id']=$actant->id();        
              $valueObject['property_id']=$oP->id();
              $valueObject['type']='resource';    
              $oItem[$oP->term()][] = $valueObject;    
              break;            
            case 'skos:hasTopConcept':
              $valueObject = [];
              $valueObject['value_resource_id']=$concept->id();        
              $valueObject['property_id']=$oP->id();
              $valueObject['type']='resource';    
              $oItem[$oP->term()][] = $valueObject;    
              break;     
            default:

          }
        }
        $result = $this->api->create('items', $oItem, [], ['continueOnError' => true])->getContent();
      }
      //ajoute ou modifie les rapports au propriété
      foreach ($data['rapports'] as $r) {
        $oItem = [];
        $oP =  $this->getProp($r['rapport']['term']);
        $valueObject = [];
        $valueObject['value_resource_id']=$r['id'];        
        $valueObject['property_id']=$oP->id();
        $valueObject['type']='resource';    
        $oItem[$oP->term()][] = $valueObject; 
        $itemId = $bExiste ? $existe[0]->id() : $result->id();
        $rslt = $this->api->update('items', $itemId, $oItem, [], ['continueOnError' => true,'isPartial'=>1, 'collectionAction' => $r['rapport']['action']]);
        unset($oItem[$oP->term()]);
      }

      return $rslt;

    }    

     /** Ajoute un actant
     *
     * @param object $user
     * @param string $urlAdmin
     * @return o:item
     */
    protected function ajouteActant($user, $urlAdmin)
    {

        //vérifie la présence de l'item pour gérer les mises à jour
        $foafAN =  $this->getProp('foaf:accountName');
        $rt =  $this->api->search('resource_templates', ['label' => 'JDC Actant',])->getContent()[0];
        $rc =  $this->getRc('jdc:Actant');
        $foafA =  $this->getProp('foaf:account');
        $ident =  $this->getProp('dcterms:isReferencedBy');
        $title =  $this->getProp('dcterms:title');

        //création de l'item
        $oItem = [];
        $valueObject = [];
        $valueObject['property_id'] = $foafA->id();
        $valueObject['@value'] = "JDC";
        $valueObject['type'] = 'literal';
        $oItem[$foafA->term()][] = $valueObject;    
        $valueObject = [];
        $valueObject['property_id'] = $ident->id();
        $valueObject['@id'] = $urlAdmin;
        $valueObject['o:label'] = 'omeka user';
        $valueObject['type'] = 'uri';
        $oItem[$ident->term()][] = $valueObject;    
        $valueObject = [];
        $valueObject['property_id'] = $title->id();
        $valueObject['@value'] = $user->name();
        $valueObject['type'] = 'literal';
        $oItem[$title->term()][] = $valueObject;    

        $param = array();
        $param['property'][0]['property']= $foafAN->id()."";
        $param['property'][0]['type']='eq';
        $param['property'][0]['text']=$user->name(); 
        $result = $this->api->search('items',$param)->getContent();
        if(count($result)){
          $result = $result[0];
          //vérifie s'il faut ajouter le compte
          $comptes = $result->value($foafA->term(),['all'=>true]);
          foreach ($comptes as $c) {
            $v = $c->asHtml();
            if($v=="JDC")return $result;
          }
          $this->api->update('items', $result->id(), $oItem, [], ['continueOnError' => true,'isPartial'=>1, 'collectionAction' => 'append']);
        }else{
          $valueObject = [];
          $valueObject['property_id'] = $foafAN->id();
          $valueObject['@value'] = $user->name();
          $valueObject['type'] = 'literal';
          $oItem[$foafAN->term()][] = $valueObject;    
          $oItem['o:resource_class'] = ['o:id' => $rc->id()];
          $oItem['o:resource_template'] = ['o:id' => $rt->id()];  
          $result = $this->api->create('items', $oItem, [], ['continueOnError' => true])->getContent();
        }              
        return $result;

    }

    function getReseauConceptAll(){
      //récupère les concepts et leurs propriétés
      set_time_limit(200);
      $class = $this->getRc('skos:Concept');
      $items = $this->api->search('items', ['resource_class_id'=>$class->id()])->getContent();
      $rs = [];
      foreach ($items as $i) {
        $rs[]=$this->getReseauConcept(['id'=>$i->id()]);
        $this->logger->info("getReseauConceptAll = ".$i->id());
      }
      return $rs;
    }

    function getReseauConcept($params){
      //récupère l'item
      $item = $this->api->read('items', $params['id'])->getContent();

      //récupère la définition des rapports entre concepts
      $rt =  $this->api->read('resource_templates', ['label' => 'JDC Rapports entre concepts'])->getContent();
      $this->skosRapports = [];
      $this->propsRelations = [];
      foreach ($rt->resourceTemplateProperties() as $p) {
        $oP = $p->property();
        $dir = $p->alternateComment();
        $this->propsRelations[$oP->term()]=['term'=>$oP->term(),'id'=>$oP->id(),'dir'=>$dir];
      }

        //requête pour récupèrer le réseau d'un concept dont il est la source
        $this->querySemanticPositionSource = array();
        $this->querySemanticPositionSource['resource_template_id']= $rt->id()."";
        $this->querySemanticPositionSource['property'][0]['property']= $this->propsRelations['skos:hasTopConcept']['id']."";
        $this->querySemanticPositionSource['property'][0]['type']='res';
        $this->querySemanticPositionSource['property'][0]['text']=$item->id(); 
        $this->querySemanticPositionSource['property'][0]['joiner']="and"; 
        $nextProperty = 1;
        if(isset($params['idActant'])){
          //POUR UN ACTANT DONNÉ
          $this->querySemanticPositionSource['property'][$nextProperty]['property']= $this->propsRelations['dcterms:creator']['id']."";
          $this->querySemanticPositionSource['property'][$nextProperty]['type']='res';
          $this->querySemanticPositionSource['property'][$nextProperty]['text']=$params['idActant']; 
          $this->querySemanticPositionSource['property'][$nextProperty]['joiner']="and";   
          $nextProperty ++;
        }
        //requête pour récupèrer le réseau d'un concept dont il est la destination
        $this->querySemanticPositionTarget = $this->querySemanticPositionSource;
        unset($this->querySemanticPositionTarget['property'][0]['property']);
        $this->querySemanticPositionTarget['property'][$nextProperty]['property']= $this->propsRelations['skos:hasTopConcept']['id']."";
        $this->querySemanticPositionTarget['property'][$nextProperty]['type']='nres';
        $this->querySemanticPositionTarget['property'][$nextProperty]['text']=$item->id(); 
        $this->querySemanticPositionTarget['property'][$nextProperty]['joiner']="and"; 
        $first = true;
        foreach ($this->propsRelations as $r) {
          if($r['dir']){
            $prop = ['property'=>$r['id']."",'type'=>'res','text'=>$item->id(),'joiner'=> $first ? "and" : "or"];
            $this->querySemanticPositionTarget['property'][]=$prop;
            $this->skosRapports[]=$r;
            $first=false;
          }
        }
        
        //récupère le réseau d'un concept
        $this->getNode($item, 0);

        //ajoute le premier élément de la liste des rapports
        array_unshift($this->skosRapports,['term'=>'Choisissez une relation','id'=>0]);

        return ['item'=>$this->setPropForIHM($item), 'cptRapports'=>$this->skosRapports, 'dataReseauConcept'=>$this->rs];      
    }

	/**
     * Ajout un noeud au résultat
     *
     * @param  o:item   $item
     * @param  int      $niv
     *
     * @return int
     */
    function getNode($item, $niv){

      /*construction de la réponse pour un affichage réseau
       * {"nodes":[{"name":"Agricultural 'waste'"},...],
       * "links":[{"source":0,"target":1,"value":124.729},...]
       * }
       */
      if(!$this->rs){
              //ajoute les noeuds "plus large" et "plus précis" 
              $this->deb = ["name"=>"Plus générique","uri"=>"","id"=>0,"type"=>"deb"];
              $this->fin = ["name"=>"Plus spécifique","uri"=>"","id"=>1,"type"=>"fin"];
              $this->rs = [
                  "nodes" => [$this->deb,$this->fin], 
                  "links" => []
              ];
              $this->doublons = array();
          }
  
          //creation des noeud de concepts
          $node = $this->ajoutReseau($item, $niv);
          $this->querySemanticPositionSource['property'][0]['text']=$node['item']['id'];
          $rs = $this->api->search('items',$this->querySemanticPositionSource)->getContent();
          foreach ($rs as $r) {
              $this->ajoutReseau($r,$niv,$node);
          }
  
          if($niv==0){
              //création des noeuds dont la source est la destination
              $rs = $this->api->search('items',$this->querySemanticPositionTarget)->getContent();
              foreach ($rs as $r) {
                  $this->ajoutReseau($r,$niv+1,$node,true);
              } 
              //   
              //création des relations quand tous les concepts sont créés
              $this->ajoutRelation();
          }
      }
  
    /**
       * Traitement des relations
       *
       * @param  o:item   $item
       * @param  int      $niv
       * @param  array    $itemBase
       *
       * @return array
       */
      function ajoutRelation(){
  
          foreach ($this->rs['nodes'] as $n) {
              if(!isset($n['liens']))continue;
              foreach ($n['liens'] as $l) {
                  $rela = array_filter($this->skosRapports, function($rlt) use ($l){
                      return $rlt['term'] == $l['term'];
                  });
                  foreach ($rela as $r) {
                      //ajoute les relations
                      if($r['dir'])$this->ajoutLien($this->rs['nodes'][$l['id']], $n, $r);
                      /*
                      if($r['dir']=='def'){
                        //$this->rs['nodes'][$this->doublons[$n["name"]]['id']][$r['term']][] = $n;
                        $this->ajoutLien($this->rs['nodes'][$l['id']], $n, $r);
                      } 
                      if($r['dir']=='='){
                        //$this->rs['nodes'][$this->doublons[$n["name"]]['id']][$r['term']][] = $n;		
                        $this->ajoutLien($this->rs['nodes'][$l['id']], $n, $r);
                      } 	
                      //if($r['dir']=='-')$this->ajoutLien($s, $n);			
                      if($r['dir']=='>'){
                          $this->ajoutLien($this->rs['nodes'][$l['id']], $n, $r);
                      }
                      if($r['dir']=='<'){
                          $this->ajoutLien($n, $this->rs['nodes'][$l['id']], $r);
                      }
                      */
                  }
              }
          }
          //ajoute les liens manquants
          $liensManquants = [];
          foreach ($this->rs['nodes'] as $n) {
              if(!isset($n['liens']))continue;
              //vérifie s'il faut relier au début
              $rela = array_filter($this->rs['links'], function($l) use ($n){
                  return $l['target'] == $n['id'];
              });
              if(count($rela)==0)$this->ajoutLien($this->deb, $n, ['term'=>'deb']);
              //vérifie s'il faut relier à la fin
              $rela = array_filter($this->rs['links'], function($l) use ($n){
                  return $l['source'] == $n['id'];
              });
              if(count($rela)==0)$this->ajoutLien($n, $this->fin,['term'=>'fin']);
          }
  
  
      }

	/**
     * Traitement du réseau de concept
     *
     * @param  o:item   $item
     * @param  int      $niv
     * @param  array    $itemBase
     * @param  boolean  $target
     *
     * @return array
     */
    function ajoutReseau($item, $niv, $itemBase=false, $target=false){
      //création du noeud de base
      if($itemBase)$s=$itemBase;
      else $s = $this->ajoutNoeud(array("name"=>$item->displayTitle(),"uri"=>$item->adminUrl(),"item"=>$this->setPropForIHM($item),"type"=>$item->resourceClass()->label(),"liens"=>[]));
      foreach ($this->skosRapports as $r) {
          if($item->value($r['term'])){
              foreach ($item->value($r['term'],['all'=>true]) as $cpt) {
                  $arrN = false;
                  switch ($cpt->type()) {
                      case "resource":
                          if($target){
                            //récupère le top concept dans le cas d'une target
                            $topCpt = $item->value('skos:hasTopConcept');
                            $oN = $this->api->read('items', $topCpt->valueResource()->id())->getContent();
                          }else{
                            //récupère l'item
                            $oN = $this->api->read('items', $cpt->valueResource()->id())->getContent();
                          }
                          $arrN = array("name"=>$oN->displayTitle(),"item"=>$this->setPropForIHM($oN)
                            ,"type"=>$oN->resourceClass()->label(),"liens"=>[]);                            
                          //ajoute le noeud
                          $n = $this->ajoutNoeud($arrN);
                          //récupère le réseau du noeud
                          if($niv <= $this->nivMax)$this->getNode($oN,$niv+1);
                          if($target){
                              $s = $n;
                              $n = $s;
                          } 

                          break;
                      case "uri":                            
                          $arrN = array("name"=>$cpt->asHtml(),"uri"=>$cpt->uri(),"type"=>$r['term']);                            
                          //ajoute le noeud
                          $n = $this->ajoutNoeud($arrN);
                          break;
                      default:
                          $arrN = array("name"=>$cpt->asHtml(),"type"=>$r['term']);                            
                          //ajoute le noeud
                          $n = $this->ajoutNoeud($arrN);
                          break;
                  }
                  //ajoute le lien
                  $this->rs['nodes'][$s['id']]['liens'][]=['term'=>$r['term'],'id'=>$n['id'],'target'=>$target];

              }
          }
      }

      return $s;		

  }


/**
   * Ajout un noeud au résultat
   *
   * @param  array $arr
   *
   * @return int
   */
  function ajoutNoeud($arr){
    $key = $arr["type"].$arr["name"];
    if(!isset($this->doublons[$key])){
            $arr["id"] = count($this->rs['nodes']);				
            $this->rs['nodes'][] = $arr;
            $this->doublons[$key] = ['nb'=>1,'id'=>$arr["id"]];    
    }else{
            $arr["id"] =  $this->doublons[$key]['id'];				
            $this->doublons[$key]['nb'] ++;
        }
    return $arr;		
  }

/**
   * Ajout un lien au résultat
   *
   * @param  int $s
   * @param  int $t
   * @param  array $r
   * @param  int $v
   *
   * @return int
   */
  function ajoutLien($s, $t, $r, $v=1){
      if($s['id']==$t['id'])return;
      if(!isset($this->doublons[$s['id']."_".$t['id']."_".$r['term']]) && !isset($this->doublons[$t['id']."_".$s['id']."_".$r['term']])){
          $this->rs['links'][] = array("source"=>$s['id'],"target"=>$t['id'], "r"=>$r
                  , 'names'=>[$s['type'].'='.$s['name'],$r['term'], $t['type'].'='.$t['name']],"value"=>$v);
          $this->doublons[$s['id']."_".$t['id']."_".$r['term']] = count($this->rs['links'])-1;						
      }
      if(isset($this->doublons[$s['id']."_".$t['id']."_".$r['term']])){
          $this->rs['links'][$this->doublons[$s['id']."_".$t['id']."_".$r['term']]]["value"]++;
          return $this->doublons[$s['id']."_".$t['id']."_".$r['term']];		
      }
      if(isset($this->doublons[$t['id']."_".$s['id']."_".$r['term']])){
          $this->rs['links'][$this->doublons[$t['id']."_".$s['id']."_".$r['term']]]["value"]++;
          return $this->doublons[$t['id']."_".$s['id']."_".$r['term']];		
      }
  }


    function createDimTxtAsso($params){
      //construction de la sélection 
      //TODO:dans l'odre du texte initial
      //asort()
      $slt="";
      foreach ($params['data'] as $d) {
        $slt = !$slt ? $d['txt'] : $slt.' '.$d['txt'];
      }
      //création de l'item d'association
      $itemAsso = $this->createDim([
        'id'=>$params['id'],'dim'=>$params['dim'],'idExi'=>false,
        'data'=>['dcterms:title'=>$slt,'dcterms:isPartOf'=>[['type'=>'resource','value'=>$params['id']]]]
      ],true);
      //création de la nouvelle association
      $item = $this->api->read('items', $params['id'])->getContent();
      $vals = ['dcterms:hasPart'=>json_encode(['itemAsso'=>$itemAsso['id'],'slt'=>$slt,'data'=>$params['data']])];
      return $this->setPropForIHM($this->updateDim(['data'=>$vals],$item));
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
            if($i->valueResource()->id()==$item->id()) return 1;
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
          //TODO:ajoute les dimensions à l'existence si elles n'existent pas          
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
      $oP = $this->getProp('jdc:has'.$params['dim']);
      $newValue[$oP->term()][]=['value_resource_id' => $params['idDim'],'property_id' => $oP->id(),'type' => 'resource'];
      $this->api->update('items', ($params['idItem'] ? $params['idItem'] : $params['idExi'])
        , $newValue, [], ['isPartial' => true,'collectionAction' => 'append']);
      return $this->api->read('items', $params['idDim'])->getContent();
    }

    function updateDim($params, $r){
      $newValue=[];
      foreach ($params['data'] as $k=>$d) {
        $nv = is_array($d) ? $d[0]['value']+0 : $d;
        $rs = $r->value($k,['all'=>true]);
        $isNew = false;
        foreach ($rs as &$v) {
          $type = $v->type();
          switch ($type) {
              case 'resource':
                  $v = $v->valueResource()->id();
                  break;
              case 'literal':
                  $v = $v->__toString();
                  break;
          }
          if($nv!=$v && !$isNew)$isNew = true;
        }
        if($isNew)$newValue = $this->setValeur($d, $this->getProp($k), $newValue);
        if(!count($rs))$newValue = $this->setValeur($d, $this->getProp($k), $newValue);
      }
      $rslt = $this->api->update('items', $r->id()
        , $newValue, [], ['isPartial' => true,'collectionAction' => 'append']);
      return $this->api->read('items', $r->id())->getContent();
    }

    function getProp($p){
      if(!isset($this->props[$p]))
        $this->props[$p]=$this->api->search('properties', ['term' => $p])->getContent()[0];
      return $this->props[$p];
    }

    function getRc($t){
      if(!isset($this->rcs[$t]))
        $this->rcs[$t] = $this->api->search('resource_classes', ['term' => $t])->getContent()[0];
      return $this->rcs[$t];
    }


    function childrenDim($r, $propAs, $getChild=true){
      $children = [];
      $itemsAsDim = $r->value($propAs, ['all' => true]);
      foreach ($itemsAsDim as $iDim) {
        $rDim = $iDim->valueResource();
        $vDim = $this->setPropForIHM($rDim);
        if($getChild){
          $vDim['children'] = $this->childrenDim($rDim, $propAs);
          //ajoute les ressources liées
          $vDim['children']=array_merge($vDim['children'], $this->linkedDim($rDim,'dcterms:isPartOf',$getChild));
        }
        if($propAs=='jdc:hasRapport')$vDim['nodes'] = $this->getRapportNodes($rDim);
        $children[]=$vDim;
      }
      return $children;
    }

    function linkedDim($r, $prop, $getChild=true){
      //recherche les ressources associés à cette propriété
      $children = [];
      $p = $this->getProp($prop);

      $param = array();
      $param['property'][0]['property']= $p->id()."";
      $param['property'][0]['text']=$r->id();
      $param['property'][0]['type']='res';
      $items = $this->api->search('items', $param)->getContent();
      foreach ($items as $item) {
        $vDim = $this->setPropForIHM($item);
        if($getChild){
          $vDim['children']=$this->linkedDim($item,$prop);
        }
        $children[]=$vDim;
      }
      return $children;
    }
    
    function findDims($val, $prop, $dim){
      $rs = [];
      $p = $this->getProp($prop);
      $rc = $this->getRc('jdc:'.$dim);

      $param = array();
      $param['resource_class_id'][0]=$rc->id();
      $param['property'][0]['property']= $p->id()."";
      $param['property'][0]['text']=$val."";
      $param['property'][0]['type']='eq';
      return $this->api->search('items', $param)->getContent();
    }

    function setPropForIHM($r){
      $v = $r->getJsonLd();
      $v['id'] = $r->id();
      $v['dim'] = $r->resourceClass()->label();
      //calcul la taille pour le conteneur d3.pack()
      $strLen = strlen($r->displayTitle());
      $v['value'] = $strLen > 10 ? $strLen : 10;
      $v['adminUrl'] = $r->adminUrl();
      $v['siteUrl'] = $r->siteUrl();
      $v['apiUrl'] = $r->apiUrl();
      return $v;
    }

    function removeDim($params){
       $oP = $this->getProp('jdc:has'.$params['dim']);
        //récupère les dimensions        
        $oDim = $this->api->read('items', $params['idExi'])->getContent();
        $newValue = json_decode(json_encode($oDim), true);
        $dims=$this->childrenDim($oDim,$oP->term(),false);
        //modifie les dimensions de l'existence
        $newValue[$oP->term()]=[];
        foreach ($dims as $d) {
          if($params['idDim']!=$d['id'])$newValue[$oP->term()][]=['value_resource_id' => $d['id'],'property_id' => $oP->id(),'type' => 'resource'];
        }        
        //supprime les rapports correspondant
        $oPR = $this->getProp('jdc:hasRapport');
        $rapports=$this->childrenDim($oDim,$oPR->term(),false);
        $newValue[$oPR->term()]=[];
        $rs = [];
        foreach ($rapports as $r) {
          $delR = false;
          foreach ($r['nodes'] as $n) {
            if($n['id']==$params['idDim'])$delR=true;
          }
          if(!$delR)$newValue[$oPR->term()][]=['value_resource_id' => $r['id'],'property_id' => $oPR->id(),'type' => 'resource'];
          else $rs[]=$r;
        }
        //met à jour l'existence
        $this->api->update('items', $params['idExi']
          , $newValue, [], ['isPartial' => true,'collectionAction' => 'replace']);
        //renvoie la liste des rapports supprimés
        return $rs;
    }

    function createDim($params,$justeDim=false){

      $oItem = [];

      //vérifie si l'item existe
      $rs = $this->findDims($params['data']['dcterms:title'],'dcterms:title',$params['dim']);
      if(count($rs)){
        $oDim = $this->updateDim($params,$rs[0]);
      }else{
        //construction des données
        $rt = $this->api->search('resource_templates', ['label' => 'JDC '.$params['dim']])->getContent()[0];
        $rc = $this->getRc('jdc:'.$params['dim']);
        $oItem = $this->setData($params['data'], $rt, $rc);      
        $oDim = $this->api->create('items', $oItem, [], ['continueOnError' => false])->getContent();  
      }
      if($justeDim || isset($params['justeDim']))return $this->setPropForIHM($oDim);

      //création de la relation
      if($params['idExi']){
        $params['idItem']=$params['idExi'];
        $params['idDim']=$oDim->id();
        $rs = $this->appendDim($params);
      }else{
        $rs[$params['dim']][] = $this->setPropForIHM($oDim);
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
