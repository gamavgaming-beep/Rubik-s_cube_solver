/* ==========================================================================
   Rubik Solver Pro - Math Cube Model (lib/cube.js)
   ========================================================================== */

(function(global) {
    'use strict';

    // Face mapping standard matching Kociemba solver
    // U: Up (White), R: Right (Green), F: Front (Red), D: Down (Yellow), L: Left (Blue), B: Back (Orange)
    const FaceNames = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };

    class CubeModel {
        constructor() {
            this.reset();
        }

        reset() {
            // Setup fully solved state represented by 54 characters string
            // Order: 9xU, 9xR, 9xF, 9xD, 9xL, 9xB
            this.state = Array(54).fill(null);
            const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
            for (let f = 0; f < 6; f++) {
                for (let i = 0; i < 9; i++) {
                    this.state[f * 9 + i] = faces[f];
                }
            }
        }

        // Returns current Kociemba string representational state
        toString() {
            return this.state.join('');
        }

        // Imports state from valid 54-char Kociemba string
        fromString(str) {
            if (str.length !== 54) return false;
            this.state = str.split('');
            return true;
        }

        // Single Face Rotation mapping index logic for standard 3x3 Rubik structure
        rotateFaceClockwise(faceIndex) {
            const temp = [...this.state];
            const offset = faceIndex * 9;

            // Rotate face corners
            this.state[offset + 0] = temp[offset + 6];
            this.state[offset + 1] = temp[offset + 3];
            this.state[offset + 2] = temp[offset + 0];
            this.state[offset + 3] = temp[offset + 7];
            this.state[offset + 5] = temp[offset + 1];
            this.state[offset + 6] = temp[offset + 8];
            this.state[offset + 7] = temp[offset + 5];
            this.state[offset + 8] = temp[offset + 2];

            // Rotate outer edge stickers depending on selected face
            if (faceIndex === FaceNames.U) {
                // U-Face boundary rotation: L -> F -> R -> B -> L
                this.cycleStickers(
                    [36, 37, 38], // L-top
                    [18, 19, 20], // F-top
                    [9, 10, 11],  // R-top
                    [45, 46, 47]  // B-top
                );
            } else if (faceIndex === FaceNames.D) {
                // D-Face boundary rotation: F -> L -> B -> R -> F
                this.cycleStickers(
                    [24, 25, 26], // F-bottom
                    [42, 43, 44], // L-bottom
                    [51, 52, 53], // B-bottom
                    [15, 16, 17]  // R-bottom
                );
            } else if (faceIndex === FaceNames.F) {
                // F-Face boundary rotation: U -> R -> D -> L -> U
                this.cycleStickers(
                    [6, 7, 8],     // U-bottom
                    [9, 12, 15],   // R-left
                    [31, 30, 29],  // D-top (reversed index)
                    [44, 41, 38]   // L-right (reversed index)
                );
            } else if (faceIndex === FaceNames.B) {
                // B-Face boundary rotation: U -> L -> D -> R -> U
                this.cycleStickers(
                    [2, 1, 0],     // U-top (reversed index)
                    [36, 39, 42],  // L-left
                    [33, 34, 35],  // D-bottom
                    [17, 14, 11]   // R-right (reversed index)
                );
            } else if (faceIndex === FaceNames.L) {
                // L-Face boundary rotation: U -> F -> D -> B -> U
                this.cycleStickers(
                    [0, 3, 6],     // U-left
                    [18, 21, 24],  // F-left
                    [27, 30, 33],  // D-left
                    [53, 50, 47]   // B-right (reversed index)
                );
            } else if (faceIndex === FaceNames.R) {
                // R-Face boundary rotation: U -> B -> D -> F -> U
                this.cycleStickers(
                    [8, 5, 2],     // U-right (reversed index)
                    [45, 48, 51],  // B-left (reversed index)
                    [35, 32, 29],  // D-right (reversed index)
                    [26, 23, 20]   // F-right
                );
            }
        }

        cycleStickers(set1, set2, set3, set4) {
            const temp = [this.state[set1[0]], this.state[set1[1]], this.state[set1[2]]];
            
            // 4 -> 3 -> 2 -> 1 (with temp holding 1)
            for (let i = 0; i < 3; i++) {
                this.state[set1[i]] = this.state[set4[i]];
                this.state[set4[i]] = this.state[set3[i]];
                this.state[set3[i]] = this.state[set2[i]];
                this.state[set2[i]] = temp[i];
            }
        }

        // Apply a complete sequence of standard moves
        applyMove(move) {
            const baseMove = move[0];
            const prime = move.includes("'");
            const double = move.includes("2");
            const faceIndex = FaceNames[baseMove];

            if (faceIndex === undefined) return;

            let iterations = 1;
            if (double) iterations = 2;
            else if (prime) iterations = 3;

            for (let i = 0; i < iterations; i++) {
                this.rotateFaceClockwise(faceIndex);
            }
        }

        // Validates if the cube is physically possible to solve
        validate() {
            const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
            for (let i = 0; i < 54; i++) {
                counts[this.state[i]]++;
            }

            // Ensure there are exactly 9 of each color
            const keys = Object.keys(counts);
            for (let k of keys) {
                if (counts[k] !== 9) {
                    return { valid: false, error: `ஒவ்வொரு பக்கத்திலும் 9 கட்டங்கள் இருக்க வேண்டும். ${k} நிறத்தில் ${counts[k]} மட்டுமே உள்ளன.` };
                }
            }

            // Verify central sticker configuration is unchanged
            const centers = [4, 13, 22, 31, 40, 49];
            const centerColors = ['U', 'R', 'F', 'D', 'L', 'B'];
            for (let c = 0; c < 6; c++) {
                if (this.state[centers[c]] !== centerColors[c]) {
                    return { valid: false, error: "மையக் கட்டங்களின் (Centers) நிறத்தை மாற்ற இயலாது." };
                }
            }

            return { valid: true };
        }
    }

    global.CubeModel = CubeModel;
})(window);

