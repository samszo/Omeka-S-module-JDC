<?php declare(strict_types=1);
namespace JDC\Service\Form;

use Interop\Container\ContainerInterface;
use JDC\Form\ConfigForm;
use Laminas\ServiceManager\Factory\FactoryInterface;

class ConfigFormFactory implements FactoryInterface
{
    public function __invoke(ContainerInterface $services, $requestedName, array $options = null)
    {
        $basePath = $services->get('Config')['file_store']['local']['base_path'] ?: (OMEKA_PATH . '/files');
        $settings = $services->get('Omeka\Settings');
        $translator = $services->get('MvcTranslator');

        $form = new ConfigForm(null, $options ?? []);
        $form->setLocalStorage($basePath);
        $form->setSettings($settings);
        $form->setTranslator($translator);

        return $form;
    }
}
