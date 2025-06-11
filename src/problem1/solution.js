/*

Problem 1: Three ways to sum to n
Link: https://s5tech.notion.site/Problem-1-Three-ways-to-sum-to-n-6052097f0f144200bbea7c2fa75c0124

*/

// Time Complexity : O(n)
// Space Complexity: O(n)
var sum_to_n_a = function(n) {
   if (n === 1) {
      return 1;
   }
   return n + sum_to_n_a(n - 1);
};

// Time Complexity : O(n)
// Space Complexity: O(1)
var sum_to_n_b = function(n) {
   let sum = 0;
   for (let i = 1; i <= n; i++) {
      sum += i;
   }
   return sum;
};

// Time Complexity : O(1)
// Space Complexity: O(1)
var sum_to_n_c = function(n) {
   return n * (n + 1) / 2; 
};

