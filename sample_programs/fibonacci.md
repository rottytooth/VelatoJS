#FIBONACCI in Velato

 // set key of A                        A
                                       
 let var_c# = 0                         C# C# | A E A E | F# B
 let var_f# = 1                         C# F# | A E Bb E | F# B
 let var_g# = 1                         C# G# | A E Bb E | F# B
                                       
 // first 11 in sequence
 while (var_g# < 11) {                  A B | A B G# | C# D | A E Bb Bb E | F# B
    print(var_c#)                       F# E | A B C# | F# B
    print(newline)                      F# E | A D Bb A E | F# B

    let var_d = var_c# + var_f#         C# D | A B C# | E C# | A B F# | F# B
    let var_c# = var_f#                 C# C# | A B F# | F# B
    let var_f# = var_d                  C# F# | A B D F# B
    let var_g# = var_g# + 1             C# G# | A B G# | E C# | C# E Bb E | F# B
 }                                      A C#
                                        A A A

##Original JS

 var count = 11, num1 = 0, num2 = 1;

 for (var i = 1; i <= count; ++i)
 {
    console.log(num1 + " ");

    var sumOfPrevTwo = num1 + num2;
    num1 = num2;
    num2 = sumOfPrevTwo;
 }
