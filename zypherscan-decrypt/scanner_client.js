import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the compiled Rust binary
// Once 'cargo build --release' finishes, the binary will be here:
const BINARY_PATH = path.join(
  __dirname,
  "target",
  "release",
  "zypherscan-decrypt"
);

/**
 * Wraps the Rust binary in a Node.js function.
 * @param {string} uvk - Unified Viewing Key
 * @param {number} birthday - Wallet birthday height
 * @param {string} action - 'all', 'summary', 'history', or 'memo'
 * @param {string} [txid] - Optional TXID for 'memo' action
 */
export async function runZypherScanner(uvk, birthday, action = "all", txid = null) {
  return new Promise((resolve, reject) => {
    const args = [uvk, birthday.toString(), action];
    if (txid) args.push(txid);

    const child = spawn(BINARY_PATH, args);

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`[NodeClient] Error: Process exited with code ${code}`);
        console.error(stderrData);
        reject(new Error(`Process exited with code ${code}`));
        return;
      }

      // Parse concatenated JSON output
      const result = {
        raw: stdoutData,
        balances: null,
        analysis: null,
        history: null,
        tx: null
      };

      try {
        // Helper to extract JSON objects/arrays from a string
        const jsonObjects = [];
        let braceCount = 0;
        let startIndex = -1;
        let inString = false;
        let escaped = false;
        let isArray = false; // distinct tracking for array [ ] if at top level?
        // Actually, since we expect separate JSONs, we can just find top-level start/end.
        // But top level can be { or [.
        
        let i = 0;
        while (i < stdoutData.length) {
            const char = stdoutData[i];
            
            if (startIndex === -1) {
                // Looking for start of JSON
                if (char === '{' || char === '[') {
                    startIndex = i;
                    braceCount = 1;
                    isArray = (char === '[');
                }
            } else {
                // Inside JSON
                if (!inString) {
                    if (char === '"') {
                        inString = true;
                    } else if (char === (isArray ? '[' : '{')) {
                        braceCount++;
                    } else if (char === (isArray ? ']' : '}')) {
                        braceCount--;
                        if (braceCount === 0) {
                            // End of this JSON object
                            const jsonStr = stdoutData.substring(startIndex, i + 1);
                            try {
                                jsonObjects.push(JSON.parse(jsonStr));
                            } catch (e) {
                                console.warn("Failed to parse extracted JSON chunk", e);
                            }
                            startIndex = -1;
                        }
                    }
                } else {
                    // Inside string
                    if (char === '"' && !escaped) {
                        inString = false;
                    } else if (char === '\\' && !escaped) {
                        escaped = true;
                    } else {
                        escaped = false;
                    }
                }
            }
            i++;
        }

        // Map parsed objects to result fields based on content
        for (const obj of jsonObjects) {
            if (Array.isArray(obj)) {
                // Must be history
                result.history = obj;
            } else if (typeof obj === 'object' && obj !== null) {
                // Distinguish between Balance, Analysis, and TxReport
                if (obj.sapling_balance !== undefined && obj.orchard_balance !== undefined) {
                    result.balances = obj;
                } else if (obj.scan_status !== undefined || obj.most_active_day !== undefined) {
                    result.analysis = obj;
                } else if (obj.txid !== undefined && obj.kind !== undefined && obj.datetime !== undefined) {
                    // Should be TxReport
                    result.tx = obj;
                }
            }
        }
        
      } catch (e) {
        console.warn(
          "[NodeClient] Warning: Could not fully parse JSON output.",
          e
        );
      }

      resolve(result);
    });
  });
}

// Check if run directly (ESM way: import.meta.url === pathToFileURL(process.argv[1]).href)
// Actually easier: if (process.argv[1] === fileURLToPath(import.meta.url))
if (process.argv[1] === __filename) {
  (async () => {
      // Check if arguments are passed from command line
      const args = process.argv.slice(2);
      
      // Usage: node scanner_client.js <UVK> <BIRTHDAY> [ACTION] [TXID]
      const myUvk = args[0]; 
      const myBirthday = args[1];
      const myAction = args[2] || 'all'; // Default to 'all' if not provided
      const myTxid = args[3] || null;    // Only needed for 'memo' action

      if (!myUvk || !myBirthday) {
          console.log("Usage: node scanner_client.js <UVK> <BIRTHDAY> [ACTION] [TXID]");
          console.log("  ACTION: 'all' (default), 'summary', 'history', 'memo'");
          console.log("  TXID:   Required only for 'memo' action");
          console.log("\nExample (History): node scanner_client.js \"uview...\" 2500000 history");
          return;
      }

      try {
          const data = await runZypherScanner(myUvk, myBirthday, myAction, myTxid);
          
          if (data.balances) {
          }

          if (data.analysis) {
              console.log("\n[NodeClient] Parsed Analysis:", data.analysis);
          }

          if (data.history) {
              const count = Array.isArray(data.history) ? data.history.length : 0;
              console.log(`\n[NodeClient] Parsed History (${count} transactions):`);
              console.log(JSON.stringify(data.history, null, 2));
          }

          if (data.tx) {
              console.log("\n[NodeClient] Parsed Transaction Report:");
              console.log(JSON.stringify(data.tx, null, 2));
          }
          
          if (myAction === 'memo') {
               console.log("\n[NodeClient] Raw Output for Memo:");
               console.log(data.raw);
          }

      } catch (err) {
          console.error("Execution failed:", err);
      }
  })();
}
