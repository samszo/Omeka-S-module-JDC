<?php declare(strict_types=1);

namespace BulkExport\Writer;

use BulkExport\Form\Writer\TextWriterConfigForm;


class MarkdownWriter extends AbstractMarkdownWriter
{
    protected $label = 'Markdown'; // @translate
    protected $extension = '.md';
    protected $mediaType = 'text/markdown';
    protected $configFormClass = TextWriterConfigForm::class;
    protected $paramsFormClass = TextWriterConfigForm::class;

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

    protected function writeFields(array $rs): self
    {
        foreach ($rs['items'] as $item) {
            $this->wItem($item);            
        }
        fwrite($this->handle, "\n");
        return $this;
    }

    protected function wItem($item): void
    {
        $this->wTitre($item);
        foreach ($item['linksR'] as $k => $linksR) {
            $this->wCallout('tip',$k);
            foreach ($linksR as $v) {
                $this->wItem($v);
            }
            /*
            switch ($k) {
                case "dcterms:isPartOf":
                    # code...
                    break;                
                default:
                    # code...
                    break;
            }
            */
        }
    }

    protected function wCallout($type,$title,$desc=""): void
    {
        //écrire un callout cf. https://quarto.org/docs/authoring/callouts.html
        $s = "::: {.callout-$type}\n"
            ."## $title\n"
            ."$desc\n"
            .":::\n";
        fwrite($this->handle, $s);

    }

    protected function wTitre($item): void
    {
        $s = str_pad("", $item['niveau']+1, "#", STR_PAD_LEFT)." ".$item['o:title']." {#sec-item".$item['o:id']."}\n";
        fwrite($this->handle, $s);
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