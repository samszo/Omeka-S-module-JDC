<?php 
namespace JDC\Site\BlockLayout;

use Laminas\View\Renderer\PhpRenderer;
use Omeka\Api\Representation\SitePageBlockRepresentation;
use Omeka\Api\Representation\SitePageRepresentation;
use Omeka\Api\Representation\SiteRepresentation;
use Omeka\Site\BlockLayout\AbstractBlockLayout;
use Omeka\Entity\SitePageBlock;
use Omeka\Stdlib\ErrorStore;

class JDC extends AbstractBlockLayout
{
    /**
     * The default partial view script.
     */
    const PARTIAL_NAME = 'common/block-layout/JDC';

    public function getLabel()
    {
        return 'JDC'; // @translate
    }

    public function onHydrate(SitePageBlock $block, ErrorStore $errorStore): void
    {
        $data = $block->getData();

        $data = $block->setData($data);
    }

    public function form(
        PhpRenderer $view,
        SiteRepresentation $site,
        SitePageRepresentation $page = null,
        SitePageBlockRepresentation $block = null
    ) {
        // Factory is not used to make rendering simpler.
        $services = $site->getServiceLocator();
        $formElementManager = $services->get('FormElementManager');
        $defaultSettings = $services->get('Config')['JDC']['block_settings']['JDC'];
 
        $data = $block ? $block->data() + $defaultSettings : $defaultSettings;

        $dataForm = [];
        foreach ($data as $key => $value) {
            $dataForm['o:block[__blockIndex__][o:data][' . $key . ']'] = $value;
        }

        $html = '<p>'
            . $view->translate('Un block pour jardiner des connaissances.') // @translate
            . '</p>';

        $blockFieldset = \JDC\Form\ConfigForm::class;

        $fieldset = $formElementManager->get($blockFieldset);
        $fieldset->populateValues($dataForm);
        $html = $view->formCollection($fieldset, false);
    
        return $html;
    }

    public function render(PhpRenderer $view, SitePageBlockRepresentation $block)
    {
        $vars = [
            'heading' => $block->dataValue('heading', ''),
        ];
        return $view->partial(self::PARTIAL_NAME, $vars);
    }

    public function getFulltextText(PhpRenderer $view, SitePageBlockRepresentation $block)
    {
        return strip_tags($this->render($view, $block));
    }

    
    public function prepareRender(PhpRenderer $view)
    {

        /*TODO: vérifier le chargement par le thème du site
        $view->headScript()->appendFile($view->assetUrl('js/bootstrap.min.js','JDC'));        
        $view->headScript()->appendFile($view->assetUrl('js/all.min.js','JDC'));        
        $view->headLink()->appendStylesheet($view->assetUrl('css/bootstrap.min.css','JDC'));
        */
        $view->headScript()->appendFile($view->assetUrl('js/d3.min.js','JDC'));
        $view->headScript()->appendFile($view->assetUrl('js/d3-hexbin.min.js','JDC'));
        $view->headScript()->appendFile($view->assetUrl('js/jquery-3.6.0.min.js','JDC'));                
        $view->headScript()->appendFile($view->assetUrl('js/jquery-ui.js','JDC'));                
        $view->headScript()->appendFile($view->assetUrl('js/jBox.all.min.js','JDC'));
        $view->headScript()->appendFile($view->assetUrl('js/jdc.js','JDC'));
        $view->headScript()->appendFile($view->assetUrl('js/ihm.js','JDC'));    
        $view->headScript()->appendFile($view->assetUrl('js/textree.js','JDC'));            
        $view->headScript()->appendFile($view->assetUrl('js/mnuContext.js','JDC'));            
        $view->headScript()->appendFile($view->assetUrl('js/sunburst-chart.js','JDC'));  
        $view->headScript()->appendFile($view->assetUrl('js/d3-sankey.min.js','JDC'));                       
        $view->headScript()->appendFile($view->assetUrl('js/exploskos.js','JDC'));               
        $view->headLink()->appendStylesheet($view->assetUrl('css/jBox.all.min.css','JDC'));
        $view->headLink()->appendStylesheet($view->assetUrl('css/jquery-ui.css','JDC'));
        $view->headLink()->appendStylesheet($view->assetUrl('css/main.css','JDC'));

    }

    public function prepareForm(PhpRenderer $view): void
    {
        $assetUrl = $view->plugin('assetUrl');
        $view->headLink()->appendStylesheet($assetUrl('css/asset-form.css', 'Omeka'));
        
    }

}