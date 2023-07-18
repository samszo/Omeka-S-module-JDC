"use strict";
class modalPatienter {
    constructor(params) {
        var me = this;
        var modal;

        this.show = function (target='body') {
            
            //merci à https://stephanwagner.me/jBox/documentation
            me.modal = new jBox('Modal', {
                title: 'Patienter',
                overlay: false,
                draggable: 'title',
                closeButton:false,
                repositionOnOpen: true,
                repositionOnContent: true,
                target: target,
                position: {
                    x: 'center',
                    y: 'center'
                },
                content:getModalContent(),
            })
            me.modal.open();
        }
        function getModalContent(){
            let html = '<div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status">';
            html += '<span class="sr-only">Loading...</span>';
            html += '</div>';
            html += '<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">';
            html += '<span class="sr-only">Loading...</span>';
            html += '</div>';
            html += '<div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status">';
            html += '<span class="sr-only">Loading...</span>';
            html += '</div>';
            return html
        }
        this.close = function () {
            me.modal.close();
        }

    }
}

  
