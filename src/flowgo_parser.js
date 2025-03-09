// Export the classes - this must be at the top level, outside any class definition
export { DebugFlowgoParser as FlowgoParser, FlowgoDiagramConverter };/**
 * Enhanced debug version of Flowgo Parser - complete implementation
 */

// First, let's create a debug wrapper around the original parser
class DebugFlowgoParser {
  constructor() {
    this.pos = 0;
    this.input = '';
    this.ast = {
      actions: [],
      entities: [],
      workflows: [],
      roles: []
    };
  }

  parse(input) {
    // Debug input with character codes
    console.log("First 20 chars of input:", input.substring(0, 20));
    console.log("Character codes of first 10 chars:", 
      Array.from(input.substring(0, 10)).map(c => c.charCodeAt(0)));
    
    // Detect and remove UTF-8 BOM if present
    if (input.charCodeAt(0) === 0xFEFF) {
      console.log("BOM detected, removing...");
      input = input.slice(1);
    }
    
    // Extra logging around position 4
    console.log("Chars at positions 0-10:", 
      Array.from(input.substring(0, 10)).map((c, i) => `pos ${i}: '${c}'`).join(", "));
    
    // Remove comments and normalize whitespace with more careful approach
    this.input = input
      .replace(/\/\/.*$/gm, '')  // Remove single-line comments
      .replace(/\s+/g, ' ');     // Normalize whitespace
    
    console.log("After comment/whitespace normalization - first 20 chars:", 
                this.input.substring(0, 20));
    
    this.pos = 0;
    this.ast = {
      actions: [],
      entities: [],
      workflows: [],
      roles: []
    };

    try {
      // Parse all definitions until end of input
      while (this.pos < this.input.length) {
        this.skipWhitespace();
        if (this.pos >= this.input.length) break;
        
        console.log(`About to parse definition at position ${this.pos}, looking at: '${this.input.substring(this.pos, this.pos + 10)}...'`);
        this.parseDefinition();
      }

      return this.ast;
    } catch (error) {
      // Enhanced error reporting
      const start = Math.max(0, this.pos - 20);
      const end = Math.min(this.input.length, this.pos + 20);
      
      console.error(`Parse error at position ${this.pos}.`);
      console.error(`Context: "${this.input.substring(start, this.pos)}[${this.input.charAt(this.pos) || 'EOF'}]${this.input.substring(this.pos + 1, end)}"`);
      
      // Display character codes around the error position
      console.error("Character codes around error:", 
        Array.from(this.input.substring(Math.max(0, this.pos - 5), Math.min(this.input.length, this.pos + 5)))
          .map((c, i) => `pos ${this.pos - 5 + i}: '${c}' (${c.charCodeAt(0)})`));
      
      throw error;
    }
  }

  skipWhitespace() {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  parseDefinition() {
    const keyword = this.peekWord();
    console.log(`Peeked keyword: '${keyword}'`);

    switch (keyword) {
      case 'action':
        this.parseActionDef();
        break;
      case 'entity':
        this.parseEntityDef();
        break;
      case 'workflow':
        this.parseWorkflowDef();
        break;
      case 'role':
        this.parseRoleDef();
        break;
      default:
        throw new Error(`Unexpected keyword: '${keyword}' at position ${this.pos}`);
    }
  }

  parseActionDef() {
    this.consumeWord('action');
    const name = this.parseIdentifier();
    this.consumeWord('by');
    
    let actorType;
    let roleName = null;
    
    if (this.peekWord() === 'role') {
      this.consumeWord('role');
      roleName = this.parseIdentifier();
      actorType = 'role';
    } else {
      actorType = this.parseActorType();
    }
    
    let parameters = [];
    if (this.peekChar() === '(') {
      parameters = this.parseParameters();
    }
    
    this.consumeChar('{');
    const body = this.parseActionBody();
    this.consumeChar('}');
    
    this.ast.actions.push({
      type: 'action',
      name,
      actorType,
      roleName,
      parameters,
      ...body
    });
  }

  parseEntityDef() {
    this.consumeWord('entity');
    const name = this.parseIdentifier();
    
    this.consumeChar('{');
    const attributes = this.parseEntityBody();
    this.consumeChar('}');
    
    this.ast.entities.push({
      type: 'entity',
      name,
      attributes
    });
  }

  parseWorkflowDef() {
    this.consumeWord('workflow');
    const name = this.parseIdentifier();
    
    this.consumeChar('{');
    const elements = this.parseWorkflowBody();
    this.consumeChar('}');
    
    this.ast.workflows.push({
      type: 'workflow',
      name,
      elements
    });
  }

  parseRoleDef() {
    console.log("Parsing role definition");
    this.consumeWord('role');
    const name = this.parseIdentifier();
    
    this.consumeChar('{');
    const attributes = this.parseRoleBody();
    this.consumeChar('}');
    
    this.ast.roles.push({
      type: 'role',
      name,
      ...attributes
    });
  }

  parseActionBody() {
    const body = {
      description: '',
      inputs: [],
      outputs: []
    };
    
    this.skipWhitespace();
    
    while (this.peekChar() !== '}') {
      const attribute = this.peekWord();
      
      if (attribute === 'description') {
        this.consumeWord('description');
        this.consumeChar(':');
        body.description = this.parseStringLiteral();
        this.consumeChar(';');
      } else if (attribute === 'inputs') {
        this.consumeWord('inputs');
        this.consumeChar(':');
        this.consumeChar('[');
        body.inputs = this.parseIdentifierList();
        this.consumeChar(']');
        this.consumeChar(';');
      } else if (attribute === 'outputs') {
        this.consumeWord('outputs');
        this.consumeChar(':');
        this.consumeChar('[');
        body.outputs = this.parseIdentifierList();
        this.consumeChar(']');
        this.consumeChar(';');
      } else {
        throw new Error(`Unexpected action attribute: ${attribute}`);
      }
      
      this.skipWhitespace();
    }
    
    return body;
  }

  parseEntityBody() {
    const attributes = [];
    
    this.skipWhitespace();
    
    while (this.peekChar() !== '}') {
      const name = this.parseIdentifier();
      this.consumeChar(':');
      const type = this.parseType();
      this.consumeChar(';');
      
      attributes.push({ name, type });
      this.skipWhitespace();
    }
    
    return attributes;
  }

  parseWorkflowBody() {
    const elements = [];
    
    this.skipWhitespace();
    
    while (this.peekChar() !== '}') {
      if (this.peekWord() === 'if') {
        elements.push(this.parseDecision());
      } else {
        elements.push(this.parseActionCall());
      }
      
      this.skipWhitespace();
    }
    
    return elements;
  }

  parseRoleBody() {
    console.log("Parsing role body");
    const body = {
      description: '',
      type: ''
    };
    
    this.skipWhitespace();
    
    while (this.peekChar() !== '}') {
      const attribute = this.peekWord();
      console.log(`Parsing role attribute: ${attribute}`);
      
      if (attribute === 'description') {
        this.consumeWord('description');
        this.consumeChar(':');
        body.description = this.parseStringLiteral();
        this.consumeChar(';');
      } else if (attribute === 'type') {
        this.consumeWord('type');
        this.consumeChar(':');
        body.type = this.parseRoleType();
        this.consumeChar(';');
      } else {
        throw new Error(`Unexpected role attribute: ${attribute}`);
      }
      
      this.skipWhitespace();
    }
    
    return body;
  }

  parseParameters() {
    const parameters = [];
    
    this.consumeChar('(');
    this.skipWhitespace();
    
    if (this.peekChar() !== ')') {
      parameters.push(this.parseParameter());
      
      while (this.peekChar() === ',') {
        this.consumeChar(',');
        this.skipWhitespace();
        parameters.push(this.parseParameter());
      }
    }
    
    this.consumeChar(')');
    
    return parameters;
  }

  parseParameter() {
    const name = this.parseIdentifier();
    this.consumeChar(':');
    const type = this.parseType();
    
    return { name, type };
  }

  parseActorType() {
    const type = this.peekWord();
    
    if (type === 'AI' || type === 'Human' || type === 'Al') {
      this.consumeWord(type);
      return type === 'Al' ? 'AI' : type;
    } else {
      throw new Error(`Expected actor type (AI or Human), got ${type}`);
    }
  }

  parseRoleType() {
    return this.parseActorType();
  }

  parseType() {
    let type = this.parseWord();
    
    // Handle generic types like List<String>
    if (type === 'List' && this.peekChar() === '<') {
      this.consumeChar('<');
      const innerType = this.parseType();
      this.consumeChar('>');
      return `List<${innerType}>`;
    }
    
    return type;
  }

  parseIdentifierList() {
    const identifiers = [];
    
    this.skipWhitespace();
    
    if (this.peekChar() !== ']') {
      identifiers.push(this.parseIdentifier());
      
      while (this.peekChar() === ',') {
        this.consumeChar(',');
        this.skipWhitespace();
        identifiers.push(this.parseIdentifier());
      }
    }
    
    return identifiers;
  }

  parseActionCall() {
    const name = this.parseIdentifier();
    let args = [];
    
    if (this.peekChar() === '(') {
      args = this.parseArgumentList();
    }
    
    this.consumeChar(';');
    
    return {
      type: 'actionCall',
      name,
      args
    };
  }

  parseArgumentList() {
    const args = [];
    
    this.consumeChar('(');
    this.skipWhitespace();
    
    if (this.peekChar() !== ')') {
      args.push(this.parseArgument());
      
      while (this.peekChar() === ',') {
        this.consumeChar(',');
        this.skipWhitespace();
        args.push(this.parseArgument());
      }
    }
    
    this.consumeChar(')');
    
    return args;
  }

  parseArgument() {
    const peek = this.input.substr(this.pos, 20);
    const namedArgMatch = peek.match(/^(\w+)\s*:/);
    
    if (namedArgMatch) {
      const name = namedArgMatch[1];
      this.pos += name.length;
      this.skipWhitespace();
      this.consumeChar(':');
      this.skipWhitespace();
      const value = this.parseExpression();
      
      return { name, value };
    } else {
      return { value: this.parseExpression() };
    }
  }

  parseDecision() {
    this.consumeWord('if');
    this.consumeChar('(');
    const condition = this.parseExpression();
    this.consumeChar(')');
    
    this.consumeChar('{');
    const ifBody = this.parseWorkflowBody();
    this.consumeChar('}');
    
    let elseBody = [];
    this.skipWhitespace();
    
    if (this.peekWord() === 'else') {
      this.consumeWord('else');
      this.consumeChar('{');
      elseBody = this.parseWorkflowBody();
      this.consumeChar('}');
    }
    
    return {
      type: 'decision',
      condition,
      ifBody,
      elseBody
    };
  }

  parseExpression() {
    const peek = this.input.substr(this.pos, 30);
    const dotNotationMatch = peek.match(/^(\w+)\.(\w+)/);
    
    if (dotNotationMatch) {
      const objName = dotNotationMatch[1];
      const propName = dotNotationMatch[2];
      this.pos += objName.length + 1 + propName.length;
      
      return {
        type: 'propertyAccess',
        object: objName,
        property: propName
      };
    }
    
    if (this.peekChar() === '"') {
      return {
        type: 'stringLiteral',
        value: this.parseStringLiteral()
      };
    } else if (/\d/.test(this.peekChar())) {
      return {
        type: 'numberLiteral',
        value: this.parseNumber()
      };
    } else if (this.peekWord() === 'true' || this.peekWord() === 'false') {
      const value = this.peekWord() === 'true';
      this.consumeWord(value ? 'true' : 'false');
      return {
        type: 'booleanLiteral',
        value
      };
    } else {
      return {
        type: 'identifier',
        name: this.parseIdentifier()
      };
    }
  }

  parseStringLiteral() {
    this.consumeChar('"');
    
    let value = '';
    while (this.pos < this.input.length && this.input[this.pos] !== '"') {
      if (this.input[this.pos] === '\\') {
        this.pos++;
        if (this.pos < this.input.length) {
          value += this.input[this.pos];
        }
      } else {
        value += this.input[this.pos];
      }
      this.pos++;
    }
    
    this.consumeChar('"');
    
    return value;
  }

  parseNumber() {
    let numStr = '';
    
    while (this.pos < this.input.length && /\d/.test(this.input[this.pos])) {
      numStr += this.input[this.pos];
      this.pos++;
    }
    
    if (this.pos < this.input.length && this.input[this.pos] === '.') {
      numStr += '.';
      this.pos++;
      
      while (this.pos < this.input.length && /\d/.test(this.input[this.pos])) {
        numStr += this.input[this.pos];
        this.pos++;
      }
    }
    
    return parseFloat(numStr);
  }

  parseIdentifier() {
    this.skipWhitespace();
    console.log(`Parsing identifier at position ${this.pos}, looking at: '${this.input.charAt(this.pos)}'`);
    
    let identifier = '';
    
    if (this.pos < this.input.length && /[a-zA-Z]/.test(this.input[this.pos])) {
      identifier += this.input[this.pos];
      this.pos++;
      
      while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
        identifier += this.input[this.pos];
        this.pos++;
      }
      
      console.log(`Parsed identifier: '${identifier}'`);
      return identifier;
    } else {
      const char = this.input[this.pos] || 'EOF';
      throw new Error(`Expected identifier at position ${this.pos}, found '${char}' (code: ${char.charCodeAt(0)})`);
    }
  }

  parseWord() {
    let word = '';
    
    this.skipWhitespace();
    
    while (this.pos < this.input.length && /[a-zA-Z]/.test(this.input[this.pos])) {
      word += this.input[this.pos];
      this.pos++;
    }
    
    return word;
  }

  peekWord() {
    const savedPos = this.pos;
    this.skipWhitespace();
    
    let word = '';
    let i = this.pos;
    
    while (i < this.input.length && /[a-zA-Z]/.test(this.input[i])) {
      word += this.input[i];
      i++;
    }
    
    this.pos = savedPos;
    
    return word;
  }

  peekChar() {
    this.skipWhitespace();
    return this.input[this.pos] || '';
  }

  consumeWord(word) {
    this.skipWhitespace();
    console.log(`Consuming word: '${word}'`);
    
    const nextWord = this.parseWord();
    
    if (nextWord !== word) {
      throw new Error(`Expected "${word}", got "${nextWord}" at position ${this.pos}`);
    }
  }

  consumeChar(char) {
    this.skipWhitespace();
    console.log(`Consuming char: '${char}'`);
    
    if (this.pos < this.input.length && this.input[this.pos] === char) {
      this.pos++;
    } else {
      throw new Error(`Expected "${char}", got "${this.input[this.pos] || 'EOF'}" at position ${this.pos}`);
    }
  }
}

// Keep the original FlowgoDiagramConverter
class FlowgoDiagramConverter {
  constructor() {
    this.nodeTypes = {
      action: { shape: 'box', prefix: 'action_' },
      entity: { shape: 'cylinder', prefix: 'entity_' },
      role: { shape: 'oval', prefix: 'role_' },
      workflow: { shape: 'hexagon', prefix: 'workflow_' },
      data: { shape: 'database', prefix: 'data_' },
      decision: { shape: 'diamond', prefix: 'decision_' }
    };
  }

  // AST to Flow conversion
  astToFlow(ast) {
    const nodes = [];
    const edges = [];
    let nodeId = 0;
    
    // Map to store node IDs by name and type
    const nodeMap = new Map();
    
    // Create nodes for all actions
    ast.actions.forEach(action => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`action_${action.name}`, id);
      
      nodes.push({
        id,
        type: 'actionNode',
        position: { x: 0, y: nodeId * 100 },
        data: { 
          label: action.name,
          actorType: action.roleName ? `role:${action.roleName}` : action.actorType,
          description: action.description,
          inputs: action.inputs || [],
          outputs: action.outputs || [],
          parameters: action.parameters || [],
          nodeType: 'action'
        }
      });
    });
    
    // Create nodes for all entities
    ast.entities.forEach(entity => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`entity_${entity.name}`, id);
      
      nodes.push({
        id,
        type: 'entityNode',
        position: { x: 300, y: nodeId * 100 },
        data: { 
          label: entity.name,
          attributes: entity.attributes,
          nodeType: 'entity'
        }
      });
    });
    
    // Create nodes for all roles
    ast.roles.forEach(role => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`role_${role.name}`, id);
      
      nodes.push({
        id,
        type: 'roleNode',
        position: { x: 600, y: nodeId * 100 },
        data: { 
          label: role.name,
          type: role.type,
          description: role.description,
          nodeType: 'role'
        }
      });
    });
    
    // Create nodes for all workflows
    ast.workflows.forEach(workflow => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`workflow_${workflow.name}`, id);
      
      nodes.push({
        id,
        type: 'workflowNode',
        position: { x: -300, y: nodeId * 100 },
        data: { 
          label: workflow.name,
          elements: workflow.elements,
          nodeType: 'workflow'
        }
      });
      
      // Process workflow elements to add edges
      this.processWorkflowElements(workflow.elements, id, nodeMap, edges, nodes, nodeId);
    });
    
    // Add data flow connections
    this.addDataFlowConnections(ast, nodeMap, nodes, edges, nodeId);
    
    return { nodes, edges };
  }
  
  // Process workflow elements
  processWorkflowElements(elements, workflowId, nodeMap, edges, nodes, nodeIdRef) {
    let nodeId = nodeIdRef;
    
    // Connect workflow to first element
    if (elements.length > 0) {
      const firstElement = elements[0];
      if (firstElement.type === 'actionCall') {
        if (nodeMap.has(`action_${firstElement.name}`)) {
          edges.push({
            id: `edge_${workflowId}_${nodeMap.get(`action_${firstElement.name}`)}`,
            source: workflowId,
            target: nodeMap.get(`action_${firstElement.name}`),
            label: 'starts with',
            type: 'default',
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { strokeWidth: 2 }
          });
        }
      }
    }
    
    // Connect sequential elements
    for (let i = 0; i < elements.length - 1; i++) {
      const currentElement = elements[i];
      const nextElement = elements[i + 1];
      
      if (currentElement.type === 'actionCall' && nextElement.type === 'actionCall') {
        if (nodeMap.has(`action_${currentElement.name}`) && nodeMap.has(`action_${nextElement.name}`)) {
          edges.push({
            id: `edge_${nodeMap.get(`action_${currentElement.name}`)}_${nodeMap.get(`action_${nextElement.name}`)}`,
            source: nodeMap.get(`action_${currentElement.name}`),
            target: nodeMap.get(`action_${nextElement.name}`),
            label: 'next',
            type: 'default',
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { strokeWidth: 2 }
          });
        }
      }
    }
    
    return nodeId;
  }
  
  // Add data flow connections
  addDataFlowConnections(ast, nodeMap, nodes, edges, nodeIdRef) {
    let nodeId = nodeIdRef;
    const dataNodes = new Map(); // Map to track data nodes
    
    // Create nodes for all outputs
    ast.actions.forEach(action => {
      if (!action.outputs) return;
      
      action.outputs.forEach(output => {
        if (!dataNodes.has(output)) {
          const id = `node_${nodeId++}`;
          dataNodes.set(output, id);
          
          nodes.push({
            id,
            type: 'dataNode',
            position: { x: 900, y: nodeId * 100 },
            data: { 
              label: output,
              nodeType: 'data'
            }
          });
        }
        
        // Connect action to its output
        if (nodeMap.has(`action_${action.name}`)) {
          edges.push({
            id: `edge_${nodeMap.get(`action_${action.name}`)}_${dataNodes.get(output)}`,
            source: nodeMap.get(`action_${action.name}`),
            target: dataNodes.get(output),
            label: 'produces',
            type: 'dataFlow',
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { strokeWidth: 2 }
          });
        }
      });
    });
    
    // Connect inputs to actions
    ast.actions.forEach(action => {
      if (!action.inputs) return;
      
      action.inputs.forEach(input => {
        if (dataNodes.has(input) && nodeMap.has(`action_${action.name}`)) {
          edges.push({
            id: `edge_${dataNodes.get(input)}_${nodeMap.get(`action_${action.name}`)}`,
            source: dataNodes.get(input),
            target: nodeMap.get(`action_${action.name}`),
            label: 'used by',
            type: 'dataFlow',
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { strokeWidth: 2 }
          });
        }
      });
    });
    
    return nodeId;
  }
  
  // Reconstruct action arguments from flow data
  reconstructActionArgs(flowData, actionNodeId) {
    const args = [];
    const actionNode = flowData.nodes.find(node => node.id === actionNodeId);
    if (!actionNode) return args;
    
    // Find incoming data flow edges
    const incomingDataEdges = flowData.edges.filter(edge => 
      edge.target === actionNodeId && edge.type === 'dataFlow');
    
    // Map inputs to arguments
    incomingDataEdges.forEach(edge => {
      const sourceNode = flowData.nodes.find(node => node.id === edge.source);
      if (sourceNode && sourceNode.data.nodeType === 'data') {
        const inputName = sourceNode.data.label;
        
        // If the action has this as an input, add it to arguments
        if (actionNode.data.inputs && actionNode.data.inputs.includes(inputName)) {
          args.push({
            name: inputName,
            value: {
              type: 'identifier',
              name: inputName
            }
          });
        }
      }
    });
    
    return args;
  }
  
  // Generate DSL code from AST
  generateDSL(ast) {
    let dslCode = '';
    
    // Generate roles
    ast.roles.forEach(role => {
      dslCode += `role ${role.name} {\n`;
      if (role.description) {
        dslCode += `  description: "${role.description}";\n`;
      }
      dslCode += `  type: ${role.type};\n`;
      dslCode += `}\n\n`;
    });
    
    // Generate actions
    ast.actions.forEach(action => {
      dslCode += `action ${action.name} by `;
      
      if (action.actorType === 'role') {
        dslCode += `role ${action.roleName}`;
      } else {
        dslCode += action.actorType;
      }
      
      // Parameters
      if (action.parameters && action.parameters.length > 0) {
        dslCode += ` (${action.parameters.map(param => `${param.name}: ${param.type}`).join(', ')})`;
      }
      
      dslCode += ` {\n`;
      
      if (action.description) {
        dslCode += `  description: "${action.description}";\n`;
      }
      
      if (action.inputs && action.inputs.length > 0) {
        dslCode += `  inputs: [${action.inputs.join(', ')}];\n`;
      }
      
      if (action.outputs && action.outputs.length > 0) {
        dslCode += `  outputs: [${action.outputs.join(', ')}];\n`;
      }
      
      dslCode += `}\n\n`;
    });
    
    // Generate entities
    ast.entities.forEach(entity => {
      dslCode += `entity ${entity.name} {\n`;
      
      entity.attributes.forEach(attr => {
        dslCode += `  ${attr.name}: ${attr.type};\n`;
      });
      
      dslCode += `}\n\n`;
    });
    
    // Generate workflows
    ast.workflows.forEach(workflow => {
      dslCode += `workflow ${workflow.name} {\n`;
      
      workflow.elements.forEach(element => {
        if (element.type === 'actionCall') {
          dslCode += `  ${element.name}`;
          
          if (element.args && element.args.length > 0) {
            dslCode += `(${element.args.map(arg => {
              if (arg.name) {
                return `${arg.name}: ${this.serializeExpression(arg.value)}`;
              } else {
                return this.serializeExpression(arg.value);
              }
            }).join(', ')})`;
          }
          
          dslCode += `;\n`;
        } else if (element.type === 'decision') {
          dslCode += `  if (${this.serializeExpression(element.condition)}) {\n`;
          
          element.ifBody.forEach(ifElement => {
            dslCode += `    ${ifElement.name}`;
            if (ifElement.args && ifElement.args.length > 0) {
              dslCode += `(${ifElement.args.map(arg => {
                if (arg.name) {
                  return `${arg.name}: ${this.serializeExpression(arg.value)}`;
                } else {
                  return this.serializeExpression(arg.value);
                }
              }).join(', ')})`;
            }
            dslCode += `;\n`;
          });
          
          dslCode += `  }`;
          
          if (element.elseBody && element.elseBody.length > 0) {
            dslCode += ` else {\n`;
            
            element.elseBody.forEach(elseElement => {
              dslCode += `    ${elseElement.name}`;
              if (elseElement.args && elseElement.args.length > 0) {
                dslCode += `(${elseElement.args.map(arg => {
                  if (arg.name) {
                    return `${arg.name}: ${this.serializeExpression(arg.value)}`;
                  } else {
                    return this.serializeExpression(arg.value);
                  }
                }).join(', ')})`;
              }
              dslCode += `;\n`;
            });
            
            dslCode += `  }`;
          }
          
          dslCode += `\n`;
        }
      });
      
      dslCode += `}\n\n`;
    });
    
    return dslCode;
  }
  
  // Serialize expression to DSL
  serializeExpression(expr) {
    if (!expr) return '';
    
    switch (expr.type) {
      case 'stringLiteral':
        return `"${expr.value}"`;
      case 'numberLiteral':
        return expr.value.toString();
      case 'booleanLiteral':
        return expr.value ? 'true' : 'false';
      case 'identifier':
        return expr.name;
      case 'propertyAccess':
        return `${expr.object}.${expr.property}`;
      default:
        return '';
    }
  }
  
  // Flow to AST conversion (for bidirectional editing)
  flowToAst(flowData) {
    const ast = {
      actions: [],
      entities: [],
      workflows: [],
      roles: []
    };
    
    // Process nodes
    flowData.nodes.forEach(node => {
      const nodeData = node.data;
      
      switch (nodeData.nodeType) {
        case 'action':
          ast.actions.push({
            type: 'action',
            name: nodeData.label,
            actorType: nodeData.actorType && nodeData.actorType.startsWith('role:') 
              ? 'role'
              : nodeData.actorType,
            roleName: nodeData.actorType && nodeData.actorType.startsWith('role:')
              ? nodeData.actorType.substring(5)
              : null,
            parameters: nodeData.parameters || [],
            description: nodeData.description || '',
            inputs: nodeData.inputs || [],
            outputs: nodeData.outputs || []
          });
          break;
        
        case 'entity':
          ast.entities.push({
            type: 'entity',
            name: nodeData.label,
            attributes: nodeData.attributes || []
          });
          break;
        
        case 'role':
          ast.roles.push({
            type: 'role',
            name: nodeData.label,
            description: nodeData.description || '',
            type: nodeData.type || 'Human'
          });
          break;
        
        case 'workflow':
          // Workflows need special handling for elements
          const workflowElements = this.reconstructWorkflowElements(flowData, node.id);
          
          ast.workflows.push({
            type: 'workflow',
            name: nodeData.label,
            elements: workflowElements
          });
          break;
      }
    });
    
    return ast;
  }
  
  // Reconstruct workflow elements from flow data
  reconstructWorkflowElements(flowData, workflowId) {
    const elements = [];
    const visited = new Set();
    
    // Find outgoing edges from workflow node
    const outgoingEdges = flowData.edges.filter(edge => edge.source === workflowId);
    if (outgoingEdges.length === 0) return elements;
    
    // Get first action
    const firstActionNodeId = outgoingEdges[0].target;
    const firstActionNode = flowData.nodes.find(node => node.id === firstActionNodeId);
    if (!firstActionNode || firstActionNode.data.nodeType !== 'action') return elements;
    
    // Add first action
    elements.push({
      type: 'actionCall',
      name: firstActionNode.data.label,
      args: this.reconstructActionArgs(flowData, firstActionNode.id)
    });
    visited.add(firstActionNodeId);
    
    // Traverse the flow graph to find subsequent actions
    let currentNodeId = firstActionNodeId;
    let moreActions = true;
    
    while (moreActions) {
      // Find outgoing edges (excluding data flow edges)
      const nextEdges = flowData.edges.filter(edge => 
        edge.source === currentNodeId && edge.type === 'default');
      
      if (nextEdges.length === 0) {
        moreActions = false;
        continue;
      }
      
      // Get next action node
      const nextNodeId = nextEdges[0].target;
      if (visited.has(nextNodeId)) {
        moreActions = false;
        continue;
      }
      
      const nextNode = flowData.nodes.find(node => node.id === nextNodeId);
      if (!nextNode || nextNode.data.nodeType !== 'action') {
        moreActions = false;
        continue;
      }
      
      // Add next action
      elements.push({
        type: 'actionCall',
        name: nextNode.data.label,
        args: this.reconstructActionArgs(flowData, nextNode.id)
      });
      
      visited.add(nextNodeId);
      currentNodeId = nextNodeId;
    }
    
    return elements;
  }
}