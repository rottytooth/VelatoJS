// set root note to A
var_Cs_Db =  0;
var_Fs_Gb =  1;
var_Gs_Ab =  1;
while (( var_Gs_Ab <  11)) {
    console.log( var_Cs_Db);
    console.log( String.fromCharCode(10));
    var_D = ( var_Cs_Db +  var_Fs_Gb);
    var_Cs_Db =  var_Fs_Gb;
    var_Fs_Gb =  var_D;
    var_Gs_Ab = ( var_Gs_Ab +  1);
}
