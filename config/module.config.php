<?php
namespace JDC;

return [

    'view_helpers' => [
        
        'invokables' => [
            'JDCViewHelper' => View\Helper\JDCViewHelper::class,
            'JDCSqlViewHelper' => View\Helper\JDCSqlViewHelper::class,
        ],                
        'factories'  => [
            'JDCFactory' => Service\ViewHelper\JDCFactory::class,
            'JDCSqlFactory' => Service\ViewHelper\JDCSqlFactory::class,
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
            'JDCphysiques' => Site\BlockLayout\JDCphysiques::class,
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
