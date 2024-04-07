<?php
namespace JDC\View\Helper;

require_once OMEKA_PATH . '/modules/JDC/vendor/autoload.php';

use Laminas\View\Helper\AbstractHelper;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;

class JDCSqlViewHelper extends AbstractHelper
{
    protected $api;
    protected $conn;
    protected $props;

    public function __construct($api, $conn)
    {
      $this->api = $api;
      $this->conn = $conn;    

    }

    /**
     * Execution de requêtes sql directement dans la base sql
     *
     * @param array     $params paramètre de l'action
     * @return array
     */
    public function __invoke($params=[],$props=[])
    {
        /*TODO faire fonctionner le cache
        try {
            $cachePool = new FilesystemAdapter();  
        } catch (\Throwable $th) {
            throw $th;
        }
        */
        if($params==[])return[];        
        if($props!=[])$this->props = $props;
        switch ($params['action']) {
            case 'statClassUsed':
                $result = $this->statClassUsed($params);
                break;
            case 'statResUsed':
                $result = $this->statResUsed($params);
                break;
            case 'propValueResource':
                $result = $this->propValueResource($params);
                break;               
            case 'complexityNbValue':
                $result = $this->complexityNbValue($params);
                break;           
            case 'complexityUpdateValue':
                $result = $this->complexityUpdateValue($params);
                break;           
            case 'complexityInsertValue':
                $result = $this->complexityInsertValue($params);
                break;           
            case 'complexityTotal':
                $result = $this->complexityTotal($params);
                break;
            case 'complexityFrequency':
                $result = $this->complexityFrequency($params);
                break;                                                           
            case 'complexityDetails':
                $result = $this->complexityDetails($params);
                break;                                                           
        }

        return $result;

    }


   /**
     * renvoie la liste des ressource concerné 
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function complexityDetails($params){
        $p=$this->api->search('properties', ['term' => 'jdc:complexityTotals'])->getContent()[0];
        $query="SELECT r.id, r.resource_type, r.title
        FROM value va
            INNER JOIN value v on v.value_annotation_id = va.resource_id
            INNER JOIN resource r on r.id = v.resource_id
        WHERE
            va.property_id = ? 
            AND SUBSTRING_INDEX(va.value, ',', 1) = ? 
            AND CAST(SUBSTRING_INDEX(va.value, ',', -1) AS INTEGER) = ? 
        ";
        $rs = $this->conn->fetchAll($query,[$p->id(),$params['dim'],$params['cpx']]);
                
        return $rs;       
    }


   /**
     * calcul la fréquence des complexités par dimension 
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function complexityFrequency($params){
        $p=$this->api->search('properties', ['term' => 'jdc:complexityTotals'])->getContent()[0];
        $query="SELECT 
        -- MIN(va.cpx) minCpx,
        -- MAX(va.cpx) maxCpx,
        -- SUM(va.cpx) sumCpx,
        COUNT(*) nbCpx,
        vCT.cpx,
        vCT.dim,
        GROUP_CONCAT(DISTINCT vCT.rt) rt
        FROM (
        SELECT 
            CAST(SUBSTRING_INDEX(va.value, ',', -1) AS SIGNED INTEGER) cpx,
            SUBSTRING_INDEX(va.value, ',', 1) dim,
            r.resource_type rt
        FROM value va
            INNER JOIN value v on v.value_annotation_id = va.resource_id
            INNER JOIN resource r on r.id = v.resource_id
        WHERE
            va.property_id = ".$p->id();
        if($params['dim'])$query .= " AND SUBSTRING_INDEX(va.value, ',', 1) = '".$params['dim']."' "; 
        if($params['rt'])$query .= " AND r.resource_type = ?"; 
        $query .=" 
        ) vCT
        GROUP BY vCT.dim, vCT.cpx
        ORDER BY vCT.cpx DESC";
        if($params['rt'])$rs = $this->conn->fetchAll($query,[$params['rt']]); 
        else $rs = $this->conn->fetchAll($query);
        return $rs;       
    }

    /**
     * calcul la complexité totale 
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function complexityTotal($params){
        $p=$this->api->search('properties', ['term' => 'jdc:complexityTotals'])->getContent()[0];
        $query="SELECT 
        MIN(va.cpx) minCpx,
        MAX(va.cpx) maxCpx,
        SUM(va.cpx) sumCpx,
        va.dim
        FROM (
        SELECT 
        CAST(SUBSTRING_INDEX(v.value, ',', -1) AS INTEGER) cpx,
        SUBSTRING_INDEX(v.value, ',', 1) dim
                FROM
            value v
        WHERE
            v.property_id = ".$p->id()." 
        ) va
        GROUP BY va.dim
        ORDER BY  va.cpx DESC";
        $rs = $this->conn->fetchAll($query);
        return $rs;       
    }

    /**
     * mise à jour de la complexité 
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function complexityInsertValue($params){

        //création de l'annotation
        $query ="INSERT INTO `resource` (`owner_id`, `is_public`, `created`,`resource_type`) VALUES
        (?,1,NOW(),?)";
        $rs = $this->conn->executeStatement($query,[$params['vals']['owner'],'Omeka\Entity\ValueAnnotation']);
        $aId = $this->conn->lastInsertId();
        $query ="INSERT INTO `value_annotation` (`id`) VALUES (".$aId.")";
        $rs = $this->conn->executeStatement($query);

        //mise à jour de la resource
        $query ="UPDATE `resource` SET `modified`=NOW() WHERE id =".$params['vals']['id'];
        $rs = $this->conn->executeStatement($query);

        //création des nouvelles valeurs d'annotation
        $this->complexityInsertAnnotationValues($aId,$params['vals']);

        //création de la valeur de la ressource
        $query = "INSERT INTO `value` (`value`,`property_id`, `type`,`resource_id`,`is_public`,`value_annotation_id`)  VALUES
            (?, ?, ?, ?, 1, ?)";
        $rs = $this->conn->executeStatement($query,
            [$params['vals']['value'],
            $params['vals']['property_id'],
            $params['vals']['type'],
            $params['vals']['id'],$aId]);
        return $rs;       
    }
    /**
     * ajout de la complexité 
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function complexityUpdateValue($params){
        //récupère les denier identifiants
        $query ="SELECT id, value_annotation_id, v.value FROM value v WHERE v.property_id = ? AND v.resource_id = ? ORDER BY id DESC";
        $rs = $this->conn->fetchAll($query,[$params['vals']['property_id'],$params['vals']['id']]);
        $aId = $rs[0]['value_annotation_id'];
        $vId = $rs[0]['id'];
        $v = $rs[0]['value'];

        /*mise à jour d'une seul valeur de complexité
        $query ="UPDATE `resource` SET `modified`=NOW() WHERE id IN (".$params['vals']['id'].",".$aId.")";
        $rs = $this->conn->executeStatement($query);
        //supression des valeurs de l'annotation
        $query ="DELETE FROM `value` WHERE resource_id = ".$aId;
        $rs = $this->conn->executeStatement($query);
        //création des nouvelles valeurs
        $this->complexityInsertAnnotationValues($aId,$params['vals']);
        //mise à jour de la valeur de la ressource
        $query ="UPDATE value v SET v.value = ? WHERE v.id = ?";
        $rs = $this->conn->executeStatement($query,[$params['vals']['value'],$vId]);
        */

        //ajoute une nouvelle annotation si la valeur totale est différente
        /*ATTENTION : il ne faut pas prendre en compte la propriété de complexité dans le calcul 
            sinon on change la complexité à chaque calcul
            car premier calcul = pas de complexité
                deuxième calcul = une complexité est déjà calculée => la complexité augmente
                troisième calcul = deux complexité sont déjà calculée => la complexité augmente
                etc...            
        */
        if($params['vals']['value']!=$v){
            $rs = $this->complexityInsertValue($params);
        }
        return $rs;       
    }

    /**
     * ajout des annotation de la complexité 
     *
     * @param array    $vals paramètre de la requête
     * @return array
     */
    function complexityInsertAnnotationValues($id,$vals){

        $query = "INSERT INTO `value` (`value`, `property_id`, `type`, `resource_id`,`is_public`) VALUES (?, ?, ?, ?, 1)";
        foreach ($vals['@annotation'] as $a) {
            foreach ($a as $v) {
                $rs = $this->conn->executeStatement($query,
                    [$v['@value'],$v['property_id'],$v['type'],$id]);
            }
        }
    }


    /**
     * renvoie le nombre de ressource par complexité
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function complexityNbValue($params){
        $query ="    SELECT 
                CAST(v.value AS INTEGER) val, COUNT(*) nb
            FROM
                property p
                    INNER JOIN
                value v ON v.property_id = p.id
            WHERE
                p.local_name = 'complexity'
            GROUP BY v.value
            ORDER BY val DESC";
        $rs = $this->conn->fetchAll($query);
        return $rs;       
    }


    /**
     * renvoie les propriété utilisées pour les valeurs de ressource
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function propValueResource($params){
        $query ="SELECT 
                v.property_id,
                COUNT(v.id),
                CONCAT(vo.prefix, ':', p.local_name) prop
            FROM
                value v
                    INNER JOIN
                property p ON p.id = v.property_id
                    INNER JOIN
                vocabulary vo ON vo.id = p.vocabulary_id
            WHERE
                v.value_resource_id IS NOT NULL
            GROUP BY v.property_id
                ";
        $rs = $this->conn->fetchAll($query);
        return $rs;       
    }

    function getProp($p){
        if(!isset($this->props[$p]))
          $this->props[$p]=$this->api->search('properties', ['term' => $p])->getContent()[0];
        return $this->props[$p];
      }
  

    /**
     * renvoie les statistiques d'utilisation d'une ressource
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function statResUsed($params){
        //if(!$this->conn->isConnected())$this->conn->connect();

        //ATTENTION: on ne prend pas en compte toutes les ressources mais uniquement certains types
        $resourceTypes = ["Annotate\Entity\Annotation","Omeka\Entity\Item","Omeka\Entity\Media","Omeka\Entity\ItemSet"];
        //ATTENTION: on exclue les propriétés de complexité pour éviter d'augmenter la complexité à chaque calcul cf. $this.complexityUpdateValue
        $oP =  $this->getProp('jdc:complexity');
        $query ="SELECT 
            r.id,
            COUNT(DISTINCT v.id) nbVal,
            COUNT(DISTINCT v.property_id) nbProp,
            COUNT(DISTINCT r.owner_id) nbOwner,
            GROUP_CONCAT(DISTINCT r.owner_id) idsOwner,
            COUNT(v.uri) nbUri,
            GROUP_CONCAT(v.uri) uris,
            COUNT(v.value_resource_id) nbRes,
            GROUP_CONCAT(v.value_resource_id) idsRes,
            GROUP_CONCAT(CONCAT(vo.prefix, ':', p.local_name)) propsRes,
            COUNT(p.local_name) nbResProp,
            r.resource_type,
            rc.label 'class label',
            rc.id 'idClass'
        FROM
            value v
                INNER JOIN
            resource r ON r.id = v.resource_id 
                LEFT JOIN
            resource_class rc ON rc.id = r.resource_class_id
                LEFT JOIN
            value vl ON vl.resource_id = v.resource_id
                AND vl.value_resource_id = v.value_resource_id
                LEFT JOIN
            property p ON p.id = vl.property_id
                LEFT JOIN
            vocabulary vo ON vo.id = p.vocabulary_id";
        $where = " WHERE v.property_id != ".$oP->id();
        if($params["id"]){
            $query .= $where." AND r.id = ? ORDER BY r.id ";
            $rs = $this->conn->fetchAll($query,[$params["id"]]);
        }elseif ($params["ids"]) {
            $query .= $where." AND r.id IN (";
            $query .= implode(',', array_fill(0, count($params['ids']), '?'));
            $query .= ")   
                GROUP BY r.id ORDER BY r.id ";
            $rs = $this->conn->fetchAll($query,$params["ids"]);
        }elseif ($params['resource_types']){
            ini_set('memory_limit', '2048M');
            $query .= $where." AND r.resource_type IN (";
            $query .= implode(',', array_fill(0, count($params['resource_types']), '?'));
            $query .= ") ";
            if($params["reprise"])$query .= " AND r.id > ".$params["reprise"];
            $query .= " GROUP BY r.id ORDER BY r.id ";
            $rs = $this->conn->fetchAll($query,$params['resource_types']);
        }elseif($params['vrid']){
            $query .= $where." AND v.value_resource_id = ? AND r.resource_type IN (";
            $query .= implode(',', array_fill(0, count($resourceTypes), '?'));
            $query .= ")  GROUP BY r.id ORDER BY r.id ";
            $rs = $this->conn->fetchAll($query,array_merge([$params["vrid"]], $resourceTypes));
        }else{
            ini_set('memory_limit', '2048M');
            $query .= $where." AND r.resource_type IN (?,?,?,?)  
                GROUP BY r.id ORDER BY r.id ";
            $rs = $this->conn->fetchAll($query,$resourceTypes);
        }
        //$this->conn->close();
        return $rs;       
    }

    /**
     * renvoie les statistiques d'utilisation des class
     *
     * @param array    $params paramètre de la requête
     * @return array
     */
    function statClassUsed($params){
        $query ='SELECT 
            COUNT(v.id) nbVal,
            COUNT(DISTINCT v.resource_id) nbItem,
            COUNT(DISTINCT v.property_id) nbProp,
            COUNT(DISTINCT r.owner_id) nbOwner,
            COUNT(DISTINCT v.uri) nbUri,
            COUNT(DISTINCT v.value_resource_id) nbRes,
            COUNT(DISTINCT v.value_annotation_id) nbAno,
            r.resource_type,
            rc.label "class label",
            rc.id
        FROM
            value v
                INNER JOIN
            resource r ON r.id = v.resource_id
                LEFT JOIN
            resource_class rc ON rc.id = r.resource_class_id
        WHERE
            r.resource_type IN (?,?,?,?)
        GROUP BY r.resource_type, rc.id, rc.id
        ';
        $rs = $this->conn->fetchAll($query,["Annotate\Entity\Annotation","Omeka\Entity\Item","Omeka\Entity\Media","Omeka\Entity\ItemSet"]);
        return $rs;       
    }

}
