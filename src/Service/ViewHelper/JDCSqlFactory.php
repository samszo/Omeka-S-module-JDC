<?php
namespace JDC\Service\ViewHelper;

use Interop\Container\ContainerInterface;
use Laminas\ServiceManager\Factory\FactoryInterface;
use JDC\View\Helper\JDCSqlViewHelper;

class JDCSqlFactory implements FactoryInterface
{
    public function __invoke(ContainerInterface $services, $requestedName, array $options = null)
    {
        $api = $services->get('Omeka\ApiManager');
        $conn = $services->get('Omeka\Connection');

        return new JDCSqlViewHelper($api, $conn);
    }
}