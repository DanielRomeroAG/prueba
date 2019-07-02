const express=require('express');

const config=require('./server/config');
 
//base de datos
require('./database');

const app=config(express());

//comenzando el servidor 
app.listen(app.get('port'),()=>{
    console.log('Servidor en el puerto ', app.get('port'));
});
