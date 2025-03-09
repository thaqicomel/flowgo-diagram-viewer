/**
 * This bridge file exports the debug-enhanced versions of the parser 
 * and converter for use in the application.
 * 
 * It solves both the file naming issue and adds debug capabilities.
 */

// Import the original implementation
import * as originalModule from './flowgo_parser';

// Use the enhanced debug parser from debugger file
// Simplified version for this bridge file
class FlowgoParser extends originalModule.FlowgoParser {
  parse(input) {
    try {
      // Extra debugging to diagnose parsing issue
      console.log("[DEBUG] Beginning to parse input");
      console.log("[DEBUG] Input starts with:", input.substring(0, 30).replace(/\n/g, "\\n"));
      console.log("[DEBUG] Char codes of first 10 chars:", 
        Array.from(input.substring(0, 10)).map(c => `'${c}': ${c.charCodeAt(0)}`));
      
      // Check for and remove UTF-8 BOM if present
      if (input.charCodeAt(0) === 0xFEFF) {
        console.log("[DEBUG] BOM detected, removing...");
        input = input.slice(1);
      }
      
      // Filter out any invisible control characters
      let filteredInput = '';
      for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        // Skip control characters except whitespace
        if (code >= 32 || code === 9 || code === 10 || code === 13) {
          filteredInput += input[i];
        } else {
          console.log(`[DEBUG] Skipping control character at pos ${i}: code ${code}`);
        }
      }
      
      // Call the original parser with the cleaned input
      return super.parse(filteredInput);
    } catch (error) {
      // Enhanced error reporting
      console.error("[DEBUG] Parse error:", error.message);
      
      if (this.input && this.pos < this.input.length) {
        const start = Math.max(0, this.pos - 20);
        const end = Math.min(this.input.length, this.pos + 20);
        const context = this.input.substring(start, this.pos) + 
                      '→[' + this.input.charAt(this.pos) + ']←' + 
                      this.input.substring(this.pos + 1, end);
        
        console.error(`[DEBUG] Context around error (position ${this.pos}): "${context}"`);
        console.error(`[DEBUG] Character at position ${this.pos}: '${this.input.charAt(this.pos)}' (code: ${this.input.charCodeAt(this.pos)})`);
        
        error.message = `${error.message} (Context: "${context}")`;
      }
      
      throw error;
    }
  }
}

// Export the classes - explicitly export FlowgoParser here
export { FlowgoParser };