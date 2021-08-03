<?php declare(strict_types=1);
namespace JDC\Form;

use Laminas\Form\Element;
use Laminas\Form\Element\Text;
use Laminas\Form\Form;
use Laminas\I18n\Translator\TranslatorAwareInterface;
use Laminas\I18n\Translator\TranslatorAwareTrait;
use Omeka\Form\Element\PropertySelect;

class ConfigForm extends Form implements TranslatorAwareInterface
{
    use TranslatorAwareTrait;

    protected $local_storage = '';

    public function setLocalStorage($local_storage): void
    {
        $this->local_storage = $local_storage;
    }

    public function setSettings($settings): void
    {
        $this->settings = $settings;
    }

    public function init(): void
    {
        $this->add([
            'name' => 'o:block[__blockIndex__][o:data][heading]',
            'type' => Element\Text::class,
            'options' => [
                'label' => 'Block title', // @translate
                'info' => 'Heading for the block, if any.', // @translate
            ],
        ]);

    }

    protected function getSetting($name)
    {
        return $this->settings->get($name);
    }

    protected function translate($args)
    {
        $translator = $this->getTranslator();
        return $translator->translate($args);
    }

}
