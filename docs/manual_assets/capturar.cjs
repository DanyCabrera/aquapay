const {chromium}=require('C:/Users/Usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'); const path=require('path');
// Puerto dedicado a la documentación.
const out=__dirname; const user={id:'demo-t',nombre:'Tesorería de demostración',rol:'tesorero',activo:true};
const v={id:'demo-v',direccion:'Sector Central · Vivienda de ejemplo 01',activa:true};
const u={id:'demo-u',nombreCompleto:'María López Ejemplo',dpi:'0000000000001',activo:true,viviendas:[v]};
const recibos=Array.from({length:14},(_,i)=>({id:'demo-r'+i,numeroRecibo:`2026-${String(24-i).padStart(3,'0')}`,fechaPago:'2026-10-27',tipoCobro:i%3===0?'compra_chorro':'tarifa_anual',totalPagado:i%3===0?'1500':'120',vivienda:{...v,usuario:u}}));
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const ctx=await browser.newContext({viewport:{width:1360,height:900},deviceScaleFactor:1});
await ctx.route('**/api/**',async route=>{const url=new URL(route.request().url());const p=url.pathname;let data;
if(p.endsWith('/auth/me'))data=user;
else if(p.endsWith('/dashboard'))data={ingresosMes:5340,ingresosMesTarifa:3840,ingresosMesChorro:1500,facturasMes:33,tarifaAnual:120,totalUsuarios:85,totalViviendas:92,ingresosPorMes:Array.from({length:10},(_,i)=>({mes:i+1,total:1000+i*350}))};
else if(p==='/api/usuarios')data=[u];
else if(p.endsWith('/siguiente-recibo'))data={numeroRecibo:'025',anioRecibo:2026};
else if(p.includes('/pendientes/'))data={tarifaAnual:120,totalChorros:1,aniosPendientes:[2024,2025,2026],detalle:[2024,2025,2026].map(anio=>({anio,monto:120})),vivienda:v,chorrosPendientesCompra:[{id:'demo-c',cantidad:1,precioCompra:'1500',activo:true}]};
else if(p.endsWith('/pdf')){await route.fulfill({contentType:'application/pdf',body:fs.readFileSync(path.join(out,'ejemplo.pdf'))});return;}
else if(p.endsWith('/recibos')){data=recibos;const q=url.searchParams.get('q');if(q)data=data.filter(r=>r.numeroRecibo.includes(q)||u.nombreCompleto.toLowerCase().includes(q.toLowerCase()));if(url.searchParams.get('limit'))data=data.slice(0,Number(url.searchParams.get('limit')));}
else {await route.fulfill({status:400,json:{message:'Operación no disponible en la demostración'}});return;}
await route.fulfill({json:{success:true,data}});});
const page=await ctx.newPage();page.setDefaultTimeout(90000);
async function shot(name,targets=[],main=false){await page.evaluate(()=>document.querySelectorAll('.manual-marker').forEach(e=>e.remove()));
for(let i=0;i<targets.length;i++){const loc=targets[i];if(!await loc.count())continue; const b=await loc.first().boundingBox();if(!b)continue;
await page.evaluate(({b,n})=>{const d=document.createElement('div');d.className='manual-marker';Object.assign(d.style,{position:'fixed',left:Math.max(1,b.x-12)+'px',top:Math.max(1,b.y-13)+'px',width:'27px',height:'27px',borderRadius:'50%',background:'#ba182b',color:'#fff',font:'bold 17px Arial',display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999,boxShadow:'0 0 0 3px white',pointerEvents:'none'});d.textContent=n;document.body.appendChild(d);},{b,n:i+1});}
await page.screenshot({path:path.join(out,name+'.png')});await page.evaluate(()=>document.querySelectorAll('.manual-marker').forEach(e=>e.remove()));console.log(name);}
await page.goto('http://127.0.0.1:3010/login');await page.getByLabel('DPI',{exact:true}).waitFor();await shot('01_acceso',[page.getByLabel('DPI',{exact:true}),page.getByLabel('Contraseña',{exact:true}),page.getByRole('button',{name:'Iniciar Sesión'}),page.getByText('Recordarme',{exact:true})]);
await page.evaluate(user=>{localStorage.setItem('aquapay_token','demo-manual');localStorage.setItem('aquapay_user',JSON.stringify(user));localStorage.setItem('theme','light');},user);
await page.goto('http://127.0.0.1:3010/dashboard');await page.getByText('Resumen de tesorería',{exact:true}).waitFor();await page.waitForTimeout(1500);await shot('02_inicio',[page.getByRole('link',{name:'Emitir',exact:true}).last(),page.getByRole('button',{name:'Actualizar resumen'}),page.getByRole('link',{name:'Historial',exact:true})]);
await page.goto('http://127.0.0.1:3010/facturacion');await page.locator('#buscar').fill('María');await page.getByRole('option').first().waitFor();await shot('03_buscar',[page.locator('#buscar'),page.getByRole('option').first()]);await page.getByRole('option').first().click();await page.locator('#anio').fill('2026');await page.locator('#beneficiario-nombre').waitFor();await page.waitForTimeout(600);await shot('04_vivienda',[page.locator('#beneficiario-nombre'),page.locator('#beneficiario-dpi'),page.locator('#vivienda-direccion'),page.locator('#cantidad-chorros')]);
await page.locator('#descripcion-pago').scrollIntoViewIfNeeded();await shot('05_tarifa',[page.getByRole('radio',{name:'Tarifa anual'}),page.locator('#anio'),page.locator('#fecha'),page.locator('#descripcion-pago'),page.getByRole('button',{name:'Emitir',exact:true})]);
await page.getByRole('radio',{name:'Compra de chorro'}).click();await shot('06_compra',[page.getByRole('radio',{name:'Compra de chorro'}),page.locator('#chorro-compra'),page.locator('#fecha-compra'),page.getByRole('button',{name:'Emitir',exact:true})]);
await page.goto('http://127.0.0.1:3010/historial');await page.getByText('Historial de recibos',{exact:true}).waitFor();await page.getByRole('button',{name:'Ver PDF'}).first().waitFor();await shot('07_historial',[page.getByRole('textbox',{name:'Buscar facturas'}),page.getByRole('combobox',{name:'Año de la factura'}),page.getByRole('combobox',{name:'Concepto de pago'}),page.getByRole('button',{name:'Buscar',exact:true}),page.getByRole('button',{name:'Exportar CSV'})]);
await page.getByRole('button',{name:'Ver PDF'}).first().click();await page.getByRole('button',{name:'Descargar',exact:true}).waitFor();await page.waitForTimeout(1200);await shot('08_pdf',[page.getByRole('button',{name:'Imprimir',exact:true}),page.getByRole('button',{name:'Descargar',exact:true}),page.getByRole('button',{name:'Cerrar',exact:true})]);await page.getByRole('button',{name:'Cerrar',exact:true}).first().click();
await page.getByRole('button',{name:'Eliminar recibo',exact:false}).first().click();await page.getByRole('button',{name:'Sí, eliminar recibo'}).waitFor();await shot('09_eliminar',[page.getByRole('button',{name:'Cancelar',exact:true}),page.getByRole('button',{name:'Sí, eliminar recibo'})]);await page.getByRole('button',{name:'Cancelar',exact:true}).click();
await page.getByRole('button',{name:'Siguiente',exact:true}).scrollIntoViewIfNeeded();await shot('10_paginas',[page.getByRole('button',{name:'Anterior',exact:true}),page.getByRole('button',{name:'Siguiente',exact:true})]);
await page.goto('http://127.0.0.1:3010/dashboard');await page.getByText('Resumen de tesorería',{exact:true}).waitFor();await shot('11_sesion',[page.getByRole('button',{name:'Salir',exact:true})]);
await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Abrir menú'}).click();await shot('12_movil',[page.getByRole('link',{name:'Emitir',exact:true}),page.getByRole('link',{name:'Historial',exact:true}),page.getByRole('button',{name:'Salir',exact:true})]);await browser.close();})();



