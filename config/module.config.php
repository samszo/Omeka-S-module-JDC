<?php declare(strict_types=1);

namespace JDC;

return [
    'view_helpers' => [
        'factories'  => [
            'jdc' => Service\ViewHelper\JDCFactory::class,
        ],
        // Pour compatibilité avec les anciens thèmes
        'aliases' => [
            'JDCViewHelper' => 'jdc',
            'JDCFactory' => 'jdc',
        ],

    ],
    'view_manager' => [
        'template_path_stack' => [
            dirname(__DIR__) . '/view',
        ],
    ],
    'block_layouts' => [
        'invokables' => [
            'jdc' => Site\BlockLayout\JDC::class,
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
    'jdc' => [
        'block_settings' => [
            'jdc' => [
                'heading' => 'Titre du jardin',
            ],
        ],
    ],
];
