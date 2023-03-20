<?php declare(strict_types=1);
/**
 * JDC
 *
 * Module pour jardiner des connaissances
 *
 * @copyright Samuel Szoniecky, 2021
 */

namespace JDC;

if (!class_exists(\Generic\AbstractModule::class)) {
    require file_exists(dirname(__DIR__) . '/Generic/AbstractModule.php')
        ? dirname(__DIR__) . '/Generic/AbstractModule.php'
        : __DIR__ . '/src/Generic/AbstractModule.php';
}

use Generic\AbstractModule;
use Laminas\EventManager\Event;
use Laminas\EventManager\SharedEventManagerInterface;
use Laminas\Mvc\Controller\AbstractController;
use Laminas\View\Renderer\PhpRenderer;

class Module extends AbstractModule
{
    const NAMESPACE = __NAMESPACE__;

    public $rsVocabularies = [
        ['prefix' => 'jdc', 'label' => 'Jardin des connaissances'],
    ];

    public $rsRessourceTemplate = [
        'Physique',
        'Actant',
        'Concept',
        'Rapport',
    ];

    protected function preInstall():void
    {
        //vérifie les dépendances
        $services = $this->getServiceLocator();
        $module = $services->get('Omeka\ModuleManager')->getModule('Generic');
        if ($module && version_compare($module->getIni('version'), '3.4.43', '<')) {
            $translator = $services->get('MvcTranslator');
            $message = new \Omeka\Stdlib\Message(
                $translator->translate('This module requires the module "%s", version %s or above.'), // @translate
                'Generic', '3.4.43'
            );
            throw new \Omeka\Module\Exception\ModuleCannotInstallException($message);
        }
    }

    protected function postUninstall():void
    {
        $services = $this->getServiceLocator();

        if (!class_exists(\Generic\InstallResources::class)) {
            require_once file_exists(dirname(__DIR__) . '/Generic/InstallResources.php')
                ? dirname(__DIR__) . '/Generic/InstallResources.php'
                : __DIR__ . '/src/Generic/InstallResources.php';
        }

        $installResources = new \Generic\InstallResources($services);
        $installResources = $installResources();

        if (!empty($_POST['remove-vocabulary'])) {
            foreach ($this->rsVocabularies as $v) {
                $installResources->removeVocabulary($v['prefix']);
            }
        }

        if (!empty($_POST['remove-template'])) {
            foreach ($this->rsRessourceTemplate as $r) {
                $installResources->removeResourceTemplate($r);
            }
        }
    }

    public function warnUninstall(Event $event): void
    {
        $view = $event->getTarget();
        $module = $view->vars()->module;
        if ($module->getId() != __NAMESPACE__) {
            return;
        }

        $serviceLocator = $this->getServiceLocator();
        $t = $serviceLocator->get('MvcTranslator');

        $vocabularyLabels = '';
        foreach ($this->rsVocabularies as $v) {
            $vocabularyLabels .= $v['label'] . ' / ';
        }

        $resourceTemplates = '';
        foreach ($this->rsRessourceTemplate as $r) {
            $resourceTemplates .= $r["o:label"] . ' / ';
        }

        $html = '<p>';
        $html .= '<strong>';
        $html .= $t->translate('WARNING'); // @translate
        $html .= '</strong>' . ': ';
        $html .= '</p>';

        $html .= '<p>';
        $html .= $t->translate('If checked, the values of the vocabularies will be removed too. The class of the resources that use a class of these vocabularies will be reset.'); // @translate
        $html .= '</p>';
        $html .= '<label><input name="remove-vocabulary" type="checkbox" form="confirmform">';
        $html .= $t->translate('Remove the vocabularies :<br/>'); // @translate
        foreach ($this->rsVocabularies as $v) {
            $html .= '"' . $v['label'] . '"<br/>'; // @translate
        }
        $html .= '</label>';

        $html .= '<p>';
        $html .= $t->translate('If checked, the resource templates will be removed too. The resource template of the resources that use it will be reset.'); // @translate
        $html .= '</p>';
        $html .= '<label><input name="remove-template" type="checkbox" form="confirmform">';
        $html .= $t->translate('Remove the resource templates :<br/>'); // @translate
        foreach ($this->rsRessourceTemplate as $rt) {
            $html .= '"' . $rt . '"<br/>'; // @translate
        }
        $html .= '</label>';

        echo $html;
    }

    public function attachListeners(SharedEventManagerInterface $sharedEventManager): void
    {
        // Display a warn before uninstalling.
        $sharedEventManager->attach(
            'Omeka\Controller\Admin\Module',
            'view.details',
            [$this, 'warnUninstall']
        );
    }
}
