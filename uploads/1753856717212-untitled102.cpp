#include <iostream>
#include <vector>
using namespace std;

int calculateGrundy(int n) {
    vector<int> count(4, 0);
    
    // Count numbers by their modulo 4 value
    for (int i = 0; i < n; i++) {
        count[i % 4]++;
    }
    
    // Use the XOR of the count values modulo 4 to determine the winner
    int grundy = 0;
    
    // The numbers modulo 4 are grouped in cycles of (0, 1, 2, 3)
    grundy ^= count[0];
    grundy ^= count[1];
    grundy ^= count[2];
    grundy ^= count[3];

    return grundy;
}

string game_winner(int t, vector<int> test_cases) {
    string result = "";
    
    for (int i = 0; i < t; i++) {
        int n = test_cases[i];
        
        // Calculate the Grundy number for the current test case
        int g = calculateGrundy(n);
        
        if (g == 0) {
            result += "Bob\n"; // If the Grundy number is 0, Bob wins (losing position for Alice)
        } else {
            result += "Alice\n"; // If the Grundy number is non-zero, Alice wins
        }
    }

    return result;
}

int main() {
    int t;
    cin >> t;
    vector<int> test_cases(t);

    // Read test cases
    for (int i = 0; i < t; i++) {
        cin >> test_cases[i];
    }

    // Output the results
    cout << game_winner(t, test_cases);
    
    return 0;
}
