<?php declare(strict_types=1);

namespace BulkExport\Writer;

use BulkExport\Form\Writer\TextWriterConfigForm;


class MarkdownWriter extends AbstractMarkdownWriter
{
    protected $label = 'Markdown'; // @translate
    protected $extension = 'md';
    protected $mediaType = 'text/markdown';
    protected $configFormClass = TextWriterConfigForm::class;
    protected $paramsFormClass = TextWriterConfigForm::class;
    protected $items = [];
    protected $itemsRef = [];

    protected $configKeys = [
        'dirpath',
        'filebase',
        'format_fields',
        'format_generic',
        'format_resource',
        'format_resource_property',
        'format_uri',
        'language',
        'resource_types',
        'metadata',
        'metadata_exclude',
        'query',
    ];

    protected $paramsKeys = [
        'dirpath',
        'filebase',
        'format_fields',
        'format_generic',
        'format_resource',
        'format_resource_property',
        'format_uri',
        'language',
        'resource_types',
        'metadata',
        'metadata_exclude',
        'query',
    ];

    /**
     * @var resource
     */
    protected $handle;

    protected function initializeOutput(): self
    {
        $this->handle = fopen($this->filepath, 'w+');
        if ($this->handle) {
            // Prepend the utf-8 bom.
            fwrite($this->handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
        } else {
            $this->hasError = true;
            $this->logger->err(
                'Unable to open output: {error}.', // @translate
                ['error' => error_get_last()['message']]
            );
        }
        return $this;
    }

    protected function sortFields(array $a, array $b, array $fields)
    {
        $va="";
        $vb="";
        foreach ($fields as $f) {
            $va = !$va && $a[$f] ? $a[$f][0]['@value'] : ""; 
            $vb = !$vb && $b[$f] ? $b[$f][0]['@value'] : ""; 
        }
        return strcmp($va, $vb);        
    }

    protected function writeFields(array $rs): self
    {
        $this->items = ['items'];
        usort($rs['items'], fn($a, $b) => $this->sortFields($a, $b,['schema:orderNumber','schema:startDate']));
        foreach ($rs['items'] as $item) {
            $this->wItem($item);            
        }
        fwrite($this->handle, "\n");
        return $this;
    }

    protected function wItem($item): void
    {
        $this->wTitre($item);
        $this->wAllProps($item);
        foreach ($item['linksR'] as $k => $linksR) {
            $this->wCallout('tip',$k);
            usort($linksR, fn($a, $b) => $this->sortFields($a, $b,['schema:orderNumber','schema:startDate']));
            foreach ($linksR as $v) {
                $this->wItem($v);
            }
        }
        fwrite($this->handle, "\n");

    }

    protected function wCallout($type,$title,$desc=""): void
    {
        //écrire un callout cf. https://quarto.org/docs/authoring/callouts.html
        $s = "::: {.callout-$type}\n"
            ."#### $title\n"
            .$desc ? "$desc\n" : ""
            .":::\n\n";
        fwrite($this->handle, $s);

    }
    
    protected function wTitre($item): void
    {
        $class = str_replace(':','-',implode("_",$item['@type']));
        $titre = $item['schema:startDate'] ? 
            $this->wProps($item,['schema:startDate','schema:endDate'],['0_0'=>'',1=>' - ','1_0'=>''],false)." ***".$item['o:title']."***" 
            : $item['o:title'];
        $num = $item['niveau'] > 2 || $item['schema:startDate'] ? " .unnumbered" : "";
        $s = str_pad("", $item['niveau']+1, "#", STR_PAD_LEFT)." ".
            $titre
            ." {#sec-item".$item['o:id']
            .$num
            ." .".$class."}\n";
        fwrite($this->handle, $s);
    }

    protected function wAllProps($item): void
    {
        foreach ($item as $k => $v) {
            switch ($k) {
                /*
                case 'schema:startDate':
                    $this->wProps($item,
                        ['schema:startDate','schema:endDate'],
                        ['0_0'=>'',1=>' - ','1_0'=>'']);
                    break;
                */
                case 'schema:duration':
                    $this->wProps($item,
                        ['schema:duration'],
                        ['0_0'=>'',0=>' Heures']);
                    break;
                case 'linksIn':
                    foreach ($v as $kl => $vl) {
                        if($kl=='OK'){
                            $this->wLink($kl,$vl);
                            fwrite($this->handle, " ");                                
                        }                        
                    }
                    fwrite($this->handle, "\n");                            
                    break;  
                case 'thumbnail_display_urls':
                    foreach ($v as $kimg => $vimg) {
                        if($vimg)$this->wImg($item['o:title'],$vimg,$kimg.$item['o:id']);
                    }
                    break;
                case 'niveau':
                case 'linksR':
                case '@type':
                case '@reverse':
                case '@id':
                case '@context':        
                case 'o:resource_template':
                case 'o:thumbnail':
                case 'o:resource_class':
                case 'o:id':
                case 'o:title':
                case 'o:is_public': 
                case 'o:created':
                case 'o:modified':
                case 'o:primary_media':
                case 'o:media':                                                              
                case 'o:owner':
                case 'o:item_set':
                case 'o:site':
                case 'dcterms:title':
                case 'dcterms:isPartOf':
                case 'dcterms:isChapterOf':
                case 'dcterms:type':
                case 'schema:startDate':
                case 'schema:endDate':
                case 'schema:orderNumber':
                case 'schema:size': 
                case 'schema:contentSize':                               
                case 'schema:upvoteCount': 
                case 'ma:hasContributedTo':
                case 'ma:isChapterOf':                               
                case 'jdc:complexity':
                case 'bibo:owner':
                case 'cito:isCompiledBy':
                    $donothing = true;
                    break;                    
                default:
                    $this->wProps($item,[$k]);
                    break;
            }
        }
    }

    protected function wProps($item,$props,$sCrible=[],$w=true): string
    {
        $s = "";
        foreach ($props as $i=>$p) {
            if($item[$p]){
                foreach ($item[$p] as $j=>$v) {
                    if(!$s)$s="**".$v['property_label']."** : ";
                    switch ($v['type']) {
                        case 'resource':
                            $ir = $this->findItem($v['value_resource_id'],$this->items);
                            if($ir){
                                $s .= " [".$v['display_title']." @sec-item".$v['value_resource_id']."] ";                        
                            }else {
                                $ref = $this->getRef($v);
                                $s .= $this->wLink($ref->displayTitle(),$ref->siteUrl('fiches', true),false)." ";
                            }    
                            break;                        
                        case 'uri':
                                $s .= $this->wLink($v['@id'],$v['@id'])." ";
                            break;                        
                        default:
                            if($sCrible)$sCrible[$i.'_'.$j]=$v['@value'];
                            $s .= $v['@value']." ";
                            break;
                    }
                }    
            }
        }
        if($sCrible && $s)$s = implode(" ",$sCrible);
        if($s && $w)fwrite($this->handle, $s."\n\n");
        return $s;            
    }
    protected function getRef($prop){
        $refs = $this->findItem($prop['value_resource_id'],$this->itemsRef);
        if($refs){
            return $this->itemsRef[$refs];
        }else{
            $ref = $this->api->read('items', $prop['value_resource_id'])->getContent();
            $this->itemsRef[]=$ref;
            return $ref;
        }
    }

    protected function findItem($id, $items){        
        //vérifie la présence de l'item dans les resources
        return array_search($id, array_column($items, 'o:id'));
    }
    protected function wImg($t,$l,$id,$s="fig-align='center'"){
        fwrite($this->handle, "![$t]($l){#fig-$id $s}\n");                            
    }
    protected function wLink($t,$l,$w=true){
        $s = "[$t]($l){target='_blank'}";
        if($w) fwrite($this->handle, $s);  
        else return $s;                          
    }
    protected function finalizeOutput(): self
    {
        if (!$this->handle) {
            $this->hasError = true;
            return $this;
        }
        fclose($this->handle);
        return $this;
    }
}