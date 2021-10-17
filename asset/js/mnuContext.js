let selectionDetail, mnuContext, mnuContextCont, mnuContextWidth = 250
, modalCreerDetailtt
, mnuContextData = {
    'start': {
      name: 'start',
      color: 'none',
      children: [{
        name: 'Existence',
        id: 11,
        color: 'white',
        value: 0,
        children: [{
          name: 'Créer',
          id: 111,
          color: 'orange',
          fct: mnuCreateDim,
          dim: 'Existence',
          value: 1
        }, {
          name: 'Choisir',
          id: 112,
          color: 'green',
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
              name: 'Admin',
              id: 1,
              color:'#404E61',
              fct: 'showDetail',
              dim: 'Existence',
              value: 1
            },{
              name: 'Existence',
              id: 10,
              color: 'black',
              value: 0,
              children: [{
                name: 'Choisir',
                id: 102,
                color: 'green',
                value: 1,
                dim: 'Existence',
                fct: showListeDim
              },{
                name: 'Créer',
                id: 101,
                color: 'orange',
                fct: mnuCreateDim,
                dim: 'Existence',
                value: 1
              }]
            },{
              name: 'Physique',
              id: 11,
              color: 'black',
              value: 0,
              children: [{
                name: 'Créer',
                id: 111,
                color: 'orange',
                fct: mnuCreateDim,
                dim: 'Physique',
                value: 1
              }, {
                name: 'Choisir',
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
                color: 'orange',
                fct: mnuCreateDim,
                dim: 'Actant',
                value: 1
              }, {
                name: 'Choisir',
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
                color: 'orange',
                fct: mnuCreateDim,
                dim: 'Concept',
                value: 1
              }, {
                name: 'Choisir',
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
                color: 'orange',
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
              name: 'Détailler',
              id: 110,
              color: 'yellow',
              fct: mnuCreateDetail,
              dim: 'Existence',
              value: 1
            }, {
              name: 'Admin',
              id: 111,
              color:'#404E61',
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
            }]
          }]
        },
        "Générateur": {
          name: 'Générateur',
          color: 'white',
          children: [{
            name: 'Paramétrer',
            id: 50,
            color: 'green',
            fct:'genParam',
            value: 1
            }, {
              name: 'Générations',
              id: 51,
              color: 'green',
              fct:'genShow',
              value: 1
            }, {
            name: 'Générer',
            id: 52,
            color:'orange',
            fct: generer,
            dim: 'Existence',
            value: 1
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
        'idDim':d.slt.data ? d.slt.data.id : d.slt.id,
        'idItem':0,
        'dim':d.dim,
        'action':'removeDim',
        'idExi':oJDC.idExi};     
        dimSaveChange(dt);
        break;          
      case 'showDetail':
        oJDC.showDetail(this.event,d.slt);
        break;    
      case 'genParam':
        oJDC.forceActant = d.slt.data ? d.slt.data : d.slt;
        oJDC.selectRapportDim(false,false);
        break;    
      default:
        d.fct ? d.fct(d) : console.log(d);
        break;
    }    
}
function mnuCreateDim(d){
  createDim(0, d.dim);
}
function mnuCreateDetail(d){
  console.log(d);
  //mis à jour du modal
  let b = d3.select('#modalCreerDetailBody');
  d3.select('#btnSaveDetail').on('click',function(){
    if(slt){
      createDim(d.id,d.dim,{
        'dcterms:title':slt,
        'dcterms:isPartOf':[{'type':'resource','value':d.id}]          
      });
    }
  })
  sltData = d.slt.data
  modalCreerDetail.show();
}
function mnuContextRemove(){
  d3.select('.sunburst-viz').remove();
}
function mnuContextInit(e,d){
  let dt = d.data ? d.data : d;
  if(dt.dim=='Existence'){
    mnuContextData.existence.children[0].name=dt['o:title'];
    mnuContextData.existence.children[0].children[0].slt = d;
    mnuContextShow(e.offsetX, e.offsetY, mnuContextData.existence);
  }else{
    let mnuData = mnuContextData.dim;
    mnuData.children[0].name=dt['o:title'];
    mnuData.children[0].color=d.color;
    //ajoute les menus de l'item
    if(dt["jdc:hasMenu"]){
      dt["jdc:hasMenu"].forEach(m=>{
        let mnuExist = mnuData.children[0].children.filter(mnu=>mnu.name==m["@value"]);
        if(mnuExist.length==0)
          mnuData.children[0].children.push(mnuContextData[m["@value"]]);
      })
    }
    //ajoute les données
    mnuData.children[0].children.forEach(m=>{
      m.dim=dt.dim;
      m.slt = d;
      if(m.children){
        m.children.forEach(mc=>{
          mc.dim=dt.dim;
          mc.slt = d;  
        })  
      }
    });
    mnuContextShow(e.offsetX, e.offsetY, mnuData);
  }
}

function showListeDim(d){
  console.log(d);
  modalSelectDim  = new jBox('Modal', {
      title: d.dim == 'Existence' ? 'Choisir une existence' : 'Choisir des dimensions '+d.dim+'s',
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
