<?php
namespace JDC;

/**
 * @var Module $this
 * @var \Laminas\ServiceManager\ServiceLocatorInterface $serviceLocator
 * @var string $newVersion
 * @var string $oldVersion
 *
 * @var \Doctrine\DBAL\Connection $connection
 * @var \Doctrine\ORM\EntityManager $entityManager
 * @var \Omeka\Api\Manager $api
 */

 if (!class_exists(\Generic\InstallResources::class)) {
    if (file_exists(dirname(__DIR__, 3) . '/Generic/InstallResources.php')) {
        require_once dirname(__DIR__, 3) . '/Generic/InstallResources.php';
    } elseif (file_exists(__DIR__ . '/InstallResources.php')) {
        require_once __DIR__ . '/InstallResources.php';
    } else {
        // Nothing to install.
        return $this;
    }
}
$installResources = new \Generic\InstallResources($serviceLocator);


$services = $serviceLocator;
$settings = $services->get('Omeka\Settings');
$config = require dirname(dirname(__DIR__)) . '/config/module.config.php';
$connection = $services->get('Omeka\Connection');
$entityManager = $services->get('Omeka\EntityManager');
$plugins = $services->get('ControllerPluginManager');
$api = $plugins->get('api');
$space = strtolower(__NAMESPACE__);


if (version_compare($oldVersion, '0.0.10', '<')) {
    $this->checkDependency();
    $installResources = $installResources();
    $installResources->checkAllResources('JDC');
    $installResources->createAllResources('JDC');
}


