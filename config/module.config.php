<?php
namespace JDC;

return [

    'view_helpers' => [
        
        'invokables' => [
            'JDCViewHelper' => View\Helper\JDCViewHelper::class,
        ],                
        'factories'  => [
            'JDCFactory' => Service\ViewHelper\JDCFactory::class,
        ],

    ],
    'view_manager' => [
        'template_path_stack' => [
            dirname(__DIR__) . '/view',
        ],
    ],    
    'block_layouts' => [
        'invokables' => [
            'JDC' => Site\BlockLayout\JDC::class,
        ],
    ],
    'form_elements' => [
        'factories' => [
            Form\ConfigForm::class => Service\Form\ConfigFormFactory::class,
        ],
    ],
    'translator' => [
        'translation_file_patterns' => [
            [
                'type' => 'gettext',
                'base_dir' => dirname(__DIR__) . '/language',
                'pattern' => '%s.mo',
                'text_domain' => null,
            ],
        ],
    ],
    'JDC' => [
        'block_settings' => [
            'JDC' => [
                'heading' => 'Titre du jardin',
            ],
        ],
    ],
    'config' => [
        'heading' => 'Titre du jardin',
    ],


];
