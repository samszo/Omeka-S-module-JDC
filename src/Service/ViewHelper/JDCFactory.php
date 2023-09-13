<?php
namespace JDC\Service\ViewHelper;

use Interop\Container\ContainerInterface;
use Laminas\ServiceManager\Factory\FactoryInterface;
use JDC\View\Helper\JDCViewHelper;

class JDCFactory implements FactoryInterface
{
    public function __invoke(ContainerInterface $services, $requestedName, array $options = null)
    {
        $arrS = [
            'api'=>$services->get('Omeka\ApiManager')
            ,'logger' => $services->get('Omeka\Logger')
            ,'settings' => $services->get('Omeka\Settings')
            ,'cnx' => $services->get('Omeka\Connection')
            ,'querySql' => $services->get('ViewHelperManager')->get('JDCSqlFactory'),

        ];         
        return new JDCViewHelper($arrS);
    }
}