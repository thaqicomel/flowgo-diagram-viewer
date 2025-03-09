// Export the enhanced converter
export { FlowgoDiagramConverter };

/**
 * Enhanced FlowgoDiagramConverter with improved edge handling
 */
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
    
    // Create nodes for all actions with handles
    ast.actions.forEach(action => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`action_${action.name}`, id);
      
      nodes.push({
        id,
        type: 'actionNode',
        position: { x: 0, y: nodeId * 150 }, // Increased spacing
        data: { 
          label: action.name,
          actorType: action.roleName ? `role:${action.roleName}` : action.actorType,
          description: action.description,
          inputs: action.inputs || [],
          outputs: action.outputs || [],
          parameters: action.parameters || [],
          nodeType: 'action'
        },
        // Explicitly set source and target handles
        sourcePosition: 'right',
        targetPosition: 'left'
      });
    });
    
    // Create nodes for all entities with handles
    ast.entities.forEach(entity => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`entity_${entity.name}`, id);
      
      nodes.push({
        id,
        type: 'entityNode',
        position: { x: 300, y: nodeId * 150 },
        data: { 
          label: entity.name,
          attributes: entity.attributes,
          nodeType: 'entity'
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      });
    });
    
    // Create nodes for all roles with handles
    ast.roles.forEach(role => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`role_${role.name}`, id);
      
      nodes.push({
        id,
        type: 'roleNode',
        position: { x: 600, y: nodeId * 150 },
        data: { 
          label: role.name,
          type: role.type,
          description: role.description,
          nodeType: 'role'
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      });
    });
    
    // Create nodes for all workflows with handles
    ast.workflows.forEach(workflow => {
      const id = `node_${nodeId++}`;
      nodeMap.set(`workflow_${workflow.name}`, id);
      
      nodes.push({
        id,
        type: 'workflowNode',
        position: { x: -300, y: nodeId * 150 },
        data: { 
          label: workflow.name,
          elements: workflow.elements,
          nodeType: 'workflow'
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      });
      
      // Process workflow elements to add edges
      this.processWorkflowElements(workflow.elements, id, nodeMap, edges, nodes, nodeId);
    });
    
    // Add data flow connections
    this.addDataFlowConnections(ast, nodeMap, nodes, edges, nodeId);

    // Add role connections to actions
    this.addRoleConnections(ast, nodeMap, edges);

    // Debug: Print all edges to console
    console.log("Generated edges:", edges);
    
    return { nodes, edges };
  }
  
  // Add connections between roles and actions
  addRoleConnections(ast, nodeMap, edges) {
    ast.actions.forEach(action => {
      if (action.actorType === 'role' && action.roleName) {
        const roleNodeId = nodeMap.get(`role_${action.roleName}`);
        const actionNodeId = nodeMap.get(`action_${action.name}`);
        
        if (roleNodeId && actionNodeId) {
          // Add edge from role to action
          edges.push({
            id: `edge_role_${roleNodeId}_${actionNodeId}`,
            source: roleNodeId,
            target: actionNodeId,
            label: 'performs',
            type: 'default',
            animated: true,
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { stroke: '#ff9900', strokeWidth: 2 }
          });
        }
      }
    });
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
            style: { stroke: '#4a3f9f', strokeWidth: 2 }
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
          const sourceId = nodeMap.get(`action_${currentElement.name}`);
          const targetId = nodeMap.get(`action_${nextElement.name}`);
          
          // Ensure unique edge ID
          const edgeId = `edge_workflow_${sourceId}_${targetId}`;
          
          edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            label: 'next',
            type: 'default',
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { stroke: '#4a3f9f', strokeWidth: 2 }
          });
          
          // Debug output
          console.log(`Added workflow sequence edge: ${currentElement.name} -> ${nextElement.name}`);
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
            position: { x: 900, y: nodeId * 150 },
            data: { 
              label: output,
              nodeType: 'data'
            },
            sourcePosition: 'right',
            targetPosition: 'left'
          });
        }
        
        // Connect action to its output
        if (nodeMap.has(`action_${action.name}`)) {
          const sourceId = nodeMap.get(`action_${action.name}`);
          const targetId = dataNodes.get(output);
          
          // Ensure unique edge ID
          const edgeId = `edge_data_output_${sourceId}_${targetId}`;
          
          edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            label: 'produces',
            type: 'dataFlow',
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '5,5' }
          });
          
          // Debug output
          console.log(`Added data output edge: ${action.name} -> ${output}`);
        }
      });
    });
    
    // Connect inputs to actions
    ast.actions.forEach(action => {
      if (!action.inputs) return;
      
      action.inputs.forEach(input => {
        if (dataNodes.has(input) && nodeMap.has(`action_${action.name}`)) {
          const sourceId = dataNodes.get(input);
          const targetId = nodeMap.get(`action_${action.name}`);
          
          // Ensure unique edge ID
          const edgeId = `edge_data_input_${sourceId}_${targetId}`;
          
          edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            label: 'used by',
            type: 'dataFlow',
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20
            },
            style: { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '5,5' }
          });
          
          // Debug output
          console.log(`Added data input edge: ${input} -> ${action.name}`);
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
      args: this.reconstructActionArgs(flowData, firstActionNodeId)
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