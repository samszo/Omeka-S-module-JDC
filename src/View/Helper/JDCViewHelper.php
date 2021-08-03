<?php
namespace JDC\View\Helper;

use Laminas\View\Helper\AbstractHelper;
use Laminas\Filter\RealPath;
use \Datetime;

class JDCViewHelper extends AbstractHelper
{
    protected $api;
    protected $logger;
    protected $settings;

    var $rs;
    var $doublons;
    var $nivMax=1;//profondeur de la recherche
    var $reseau;
    var $r;
    //pour éviter un réseau trop grand on exclut des relations
    var $excluRela = ['skos:semanticRelation','cito:isCompiledBy'];
    var $showItemset = [];
    
    public function __construct($services)
    {
      $this->api = $services['api'];
      $this->logger = $services['logger'];
      $this->settings = $services['settings']->get('JDCConfigs');

    }


    /**
     * Cosntruction du jardin
     *
     * @param o:resource            $r        resource omeka
     * @param int                   $nivMax   pronfondeur du reseau
     * 
     * @return array
     */
    public function __invoke($r, $nivMax=false)
    {


      return [];

    }
    

}
