let mnuContext, mnuContextCont, mnuContextWidth = 250
, mnuContextData = {
    'start': {
      name: 'start',
      color: 'none',
      children: [{
        name: 'Existence',
        id: 11,
        color: 'green',
        value: 0,
        children: [{
          name: 'Créer',
          id: 111,
          color: 'yellow',
          fct: mnuCreateDim,
          dim: 'Existence',
          value: 1
        }, {
          name: 'Sélectionner',
          id: 112,
          color: 'red',
          value: 1,
          dim: 'Existence',
          fct: showListeDim
        }]
      }]
    },
    'existence': {
      name: 'existence',
      color: 'white',
      children: [{
          name: 'Nom',
          id: 1,
          color: 'white',
          value: 0,
            children: [{
              name: 'Physique',
              id: 11,
              color: 'black',
              value: 0,
              children: [{
                name: 'Créer',
                id: 111,
                color: 'yellow',
                fct: mnuCreateDim,
                dim: 'Physique',
                value: 1
              }, {
                name: 'Sélectionner',
                id: 112,
                color: 'green',
                value: 1,
                dim: 'Physique',
                fct: showListeDim
              }]
            }, {
              name: 'Actant',
              id: 21,
              color: 'black',
              value: 0,
              children: [{
                name: 'Créer',
                id: 211,
                color: 'yellow',
                fct: mnuCreateDim,
                dim: 'Actant',
                value: 1
              }, {
                name: 'Sélectionner',
                id: 212,
                color: 'green',
                value: 1,
                dim: 'Actant',
                fct: showListeDim
              }]
            }, {
              name: 'Concept',
              id: 31,
              color: 'black',
              value: 0,
              children: [{
                name: 'Créer',
                id: 311,
                color: 'yellow',
                fct: mnuCreateDim,
                dim: 'Concept',
                value: 1
              }, {
                name: 'Sélectionner',
                id: 312,
                color: 'green',
                value: 1,
                dim: 'Concept',
                fct: showListeDim
              }]
            }, {
              name: 'Rapport',
              id: 41,
              color: 'black',
              value: 0,
              children: [{
                name: 'Créer',
                id: 411,
                color: 'yellow',
                fct: mnuCreateDim,
                dim: 'Rapport',
                value: 1
              }]
            }]
          }]
        },
        'dim': {
          name: 'dim',
          color: 'white',
          children: [{
            name: 'dimName',
            id: 11,
            color: 'white',
            fct: mnuContextRemove,
            value: 1,
            children: [{
              name: 'Créer détail',
              id: 110,
              color: 'yellow',
              fct: mnuCreateDim,
              dim: 'Existence',
              value: 1
            }, {
              name: 'Infos',
              id: 111,
              color: 'blue',
              fct: 'showDetail',
              dim: 'Existence',
              value: 1
            }, {
              name: 'Enlever',
              id: 112,
              color: 'orange',
              value: 1,
              dim: 'Existence',
              fct: 'removeDim'
            }, {
              name: 'Supprimer',
              id: 113,
              color: 'red',
              value: 1,
              dim: 'Existence',
              fct: 'removeDim'
            }]
          }]
        }
      };
    
function mnuContextShow(x, y, data){
  mnuContextRemove();
  mnuContextCont.style('left',x+'px').style('top',y+'px');
  let mnuContext = Sunburst()
      .data(data)
      //.color(d => color(d.name))
      .color('color')
      .width(mnuContextWidth).height(mnuContextWidth)
      .minSliceAngle(.4)
      .excludeRoot(true)
      .onClick(mnuContextClick);
  mnuContext(mnuContextCont.node());
}
function mnuContextClick(d){
    switch (d.fct) {
      case 'removeDim':
        let dt={'checked':false,
        'idDim':d.slct.data.id,
        'idItem':0,
        'dim':d.dim,
        'action':'removeDim',
        'idExi':oJDC.idExi};     
        dimSaveChange(dt);
        break;          
      case 'showDetail':
        oJDC.showDetail(this.event,d.slt);
        break;    
      default:
        d.fct ? d.fct(d) : console.log(d);
        break;
    }    
}
function mnuCreateDim(d){
  createDim(0, d.dim);
}
function mnuContextRemove(){
  d3.select('.sunburst-viz').remove();
}
function mnuContextInit(e,d){
  let dt = d.data ? d.data : d;
  if(dt.dim=='Existence'){
    mnuContextData.existence.children[0].name=dt['o:title'];
    mnuContextShow(e.offsetX, e.offsetY, mnuContextData.existence);
  }else{
    mnuContextData.dim.children[0].name=dt['o:title'];
    mnuContextData.dim.children[0].color=d.color;
    mnuContextData.dim.children[0].children.forEach((m,i)=>{
      m.dim=dt.dim;
      m.slt = d;
    });
    mnuContextShow(e.offsetX, e.offsetY, mnuContextData.dim);
  }
}

function showListeDim(d){
  console.log(d);
  modalSelectDim  = new jBox('Modal', {
      title: d.dim == 'Existence' ? 'Sélectionner une existence' : 'Sélectionner des '+d.dim+'s',
      overlay: false,
      draggable: 'title',
      repositionOnOpen: true,
      repositionOnContent: true,
      target: '#jdcMainContainer',
      position: {
          x: 'center',
          y: 'center'
      },
      ajax: {
          url: urlAjax,
          type: 'POST',
          dataType: 'json',
          data: {
              'dim': d.dim,
              'idExi': d.dim=="Existence" ? null : oJDC.idExi,
              'action': 'listeDim'                    
          },
          reload: 'strict',
          setContent: false,
          success: function (response) {
            console.log('jBox AJAX response', response);
            this.setContent(getHtmlListeDim(response,d.dim));            
          },
          error: function () {
              this.setContent('<b style="color: #d33">Error loading content.</b>');
          }
      }
  })
  modalSelectDim.open();            
}
function getHtmlListeDim(rs, dim){
  
  let html = `<ul id="jdcListeDim" class="list-group">`;
  rs.forEach(item => {
    html += `<li class="list-group-item">
        <input class="form-check-input me-1" 
        ${dim!='Existence' ? 'type="checkbox"' : 'type="radio" name="dimExistenceSelect"'}
        ${item['isInExi']?'checked="true"':''}
        onchange="dimItemChange({'idDim':${item.id},'idItem':${oJDC.idExi},'dim':'${dim}'})"
        value="" aria-label="...">
        ${item['o:title'] }
      </li>`; 
  });
  html += `</ul>`;
  return html;
}
