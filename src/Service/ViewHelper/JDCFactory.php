<?php declare(strict_types=1);

namespace JDC\Service\ViewHelper;

use Interop\Container\ContainerInterface;
use JDC\View\Helper\JDC;
use Laminas\ServiceManager\Factory\FactoryInterface;

class JDCFactory implements FactoryInterface
{
    public function __invoke(ContainerInterface $services, $requestedName, array $options = null)
    {
        return new JDC(
            $services->get('Omeka\ApiManager'),
            $services->get('Omeka\Logger'),
            $services->get('Omeka\Settings'),
            $services->get('Omeka\Connection')
        );
    }
}
