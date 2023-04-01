
var count = 11, num1 = 0, num2 = 1;

for (var i = 1; i <= count; ++i)
{
   console.log(num1 + " ");

   var sumOfPrevTwo = num1 + num2;
   num1 = num2;
   num2 = sumOfPrevTwo;
}
/*

declare var_c# // num1                 A D C#
declare var_f# // num2                 D F#
declare var_g# // i                    D G#
declare var_d // sumOfPrevTwo          D D
                                       
let var_c# = 0                         C# C# E A F# B
let var_f# = 1                         C# F# E B F# B
let var_g# = 1                         C# G# E B F# B
                                       
while (var_g# < 11) {                  E B C# B G# B D C# E B B F# B A
   print(var_c#)                       F# E C# E C# F# B
   print(newline)                      F# E C# E B A E F# B

   let var_d = var_c# + var_f#         C# D C# B C# E C# C# B F# F# B
   let var_c# = var_f#                 C# C# C# B F# F# B
   let var_f# = var_d                  C# F# C# B D F# B
   let var_g# = var_g# + 1             C# G# C# B G# E C# C# E B F# B
}                                      E C#
                                       A A A
*/