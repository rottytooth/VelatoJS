#FIBONACCI in Velato

```
 // set key of A                        A
                                       
 let var_c# = 0                         C# C# | A E A E
 let var_f# = 1                         C# F# | A E Bb E
 let var_g# = 1                         C# G# | A E Bb E
                                       
 // first 11 in sequence
 while (var_g# < 11) {                  A B | C# D | A B G# | A E Bb Bb E
    print(var_c#)                       F# E | A B C#
    print(newline)                      F# E | A D Bb A E

    let var_d = var_c# + var_f#         C# D | E C# | A B C# | A B F#
    let var_c# = var_f#                 C# C# | A B F#
    let var_f# = var_d                  C# F# | A B D F# B
    let var_g# = var_g# + 1             C# G# | E C# | A B G# | C# E Bb E
 }                                      A C#
```

##Expected output

```
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
```