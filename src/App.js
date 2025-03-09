import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowgoParser } from './flowgo_parser_converter';
import { FlowgoDiagramConverter } from './fixed_converter';
import dagre from 'dagre';
import './App.css';

// Custom ActionNode with explicit handles
const ActionNode = ({ data, isConnectable }) => (
  <div className="action-node node">
    <Handle
      type="target"
      position="left"
      id="action-target"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
    <div className="node-content">
      <div className="node-header">
        <h3>{data.label}</h3>
        <div className="node-type">Action ({data.actorType})</div>
      </div>
      <div className="node-body">
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
        {data.inputs?.length > 0 && (
          <div className="node-inputs">
            <div className="label">Inputs:</div>
            <ul>
              {data.inputs.map((input, index) => (
                <li key={`input-${index}`}>{input}</li>
              ))}
            </ul>
          </div>
        )}
        {data.outputs?.length > 0 && (
          <div className="node-outputs">
            <div className="label">Outputs:</div>
            <ul>
              {data.outputs.map((output, index) => (
                <li key={`output-${index}`}>{output}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
    <Handle
      type="source"
      position="right"
      id="action-source"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
  </div>
);

// Custom EntityNode with explicit handles
const EntityNode = ({ data, isConnectable }) => (
  <div className="entity-node node">
    <Handle
      type="target"
      position="left"
      id="entity-target"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
    <div className="node-content">
      <div className="node-header">
        <h3>{data.label}</h3>
        <div className="node-type">Entity</div>
      </div>
      <div className="node-body">
        {data.attributes?.length > 0 && (
          <div className="node-attributes">
            <div className="label">Attributes:</div>
            <ul>
              {data.attributes.map((attr, index) => (
                <li key={`attr-${index}`}>
                  {attr.name}: {attr.type}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
    <Handle
      type="source"
      position="right"
      id="entity-source"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
  </div>
);

// Custom RoleNode with explicit handles
const RoleNode = ({ data, isConnectable }) => (
  <div className="role-node node">
    <Handle
      type="target"
      position="left"
      id="role-target"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
    <div className="node-content">
      <div className="node-header">
        <h3>{data.label}</h3>
        <div className="node-type">Role ({data.type})</div>
      </div>
      <div className="node-body">
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
      </div>
    </div>
    <Handle
      type="source"
      position="right"
      id="role-source"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
  </div>
);

// Custom WorkflowNode with explicit handles
const WorkflowNode = ({ data, isConnectable }) => (
  <div className="workflow-node node">
    <Handle
      type="target"
      position="left"
      id="workflow-target"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
    <div className="node-content">
      <div className="node-header">
        <h3>{data.label}</h3>
        <div className="node-type">Workflow</div>
      </div>
    </div>
    <Handle
      type="source"
      position="right"
      id="workflow-source"
      style={{ background: '#4a3f9f', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
  </div>
);

// Custom DataNode with explicit handles
const DataNode = ({ data, isConnectable }) => (
  <div className="data-node node">
    <Handle
      type="target"
      position="left"
      id="data-target"
      style={{ background: '#ff6b6b', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
    <div className="node-content">
      <div className="node-header">
        <h3>{data.label}</h3>
        <div className="node-type">Data</div>
      </div>
    </div>
    <Handle
      type="source"
      position="right"
      id="data-source"
      style={{ background: '#ff6b6b', border: '2px solid #fff' }}
      isConnectable={isConnectable}
    />
  </div>
);

// Define custom node types - IMPORTANT: This needs to be outside any component
const nodeTypes = {
  actionNode: ActionNode,
  entityNode: EntityNode,
  roleNode: RoleNode,
  workflowNode: WorkflowNode,
  dataNode: DataNode
};

// Define custom edge types with improved rendering
const edgeTypes = {
  default: ({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, style, markerEnd }) => {
    const edgePath = `M${sourceX},${sourceY} C${sourceX + 100},${sourceY} ${targetX - 100},${targetY} ${targetX},${targetY}`;
    
    return (
      <g>
        <path
          id={id}
          style={style || { stroke: '#4a3f9f', strokeWidth: 2 }}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={markerEnd}
        />
        {label && (
          <text>
            <textPath 
              href={`#${id}`} 
              style={{ fontSize: '12px' }} 
              startOffset="50%" 
              textAnchor="middle">
              {label}
            </textPath>
          </text>
        )}
      </g>
    );
  },
  
  dataFlow: ({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, style, markerEnd }) => {
    const edgePath = `M${sourceX},${sourceY} C${sourceX + 100},${sourceY} ${targetX - 100},${targetY} ${targetX},${targetY}`;
    
    return (
      <g>
        <path
          id={id}
          style={style || { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '5,5' }}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={markerEnd}
        />
        {label && (
          <text>
            <textPath 
              href={`#${id}`} 
              style={{ fontSize: '12px', fill: '#ff6b6b' }} 
              startOffset="50%" 
              textAnchor="middle">
              {label}
            </textPath>
          </text>
        )}
      </g>
    );
  }
};

// Node properties form component
const NodePropertiesForm = ({ selectedNode, onUpdate }) => {
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeInputs, setNodeInputs] = useState('');
  const [nodeOutputs, setNodeOutputs] = useState('');
  
  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.data.label || '');
      setNodeDescription(selectedNode.data.description || '');
      setNodeInputs(selectedNode.data.inputs?.join(', ') || '');
      setNodeOutputs(selectedNode.data.outputs?.join(', ') || '');
    }
  }, [selectedNode]);
  
  const handleUpdate = () => {
    if (!selectedNode) return;
    
    const updatedData = {
      ...selectedNode.data,
      label: nodeName,
      description: nodeDescription,
      inputs: nodeInputs.split(',').map(i => i.trim()).filter(i => i),
      outputs: nodeOutputs.split(',').map(o => o.trim()).filter(o => o)
    };
    
    onUpdate(selectedNode.id, updatedData);
  };
  
  if (!selectedNode) return null;
  
  return (
    <div className="node-properties-form">
      <h3>Edit Node Properties</h3>
      <div className="form-group">
        <label>Name:</label>
        <input 
          type="text" 
          value={nodeName} 
          onChange={(e) => setNodeName(e.target.value)} 
        />
      </div>
      
      <div className="form-group">
        <label>Description:</label>
        <textarea 
          value={nodeDescription} 
          onChange={(e) => setNodeDescription(e.target.value)} 
        />
      </div>
      
      {(selectedNode.type === 'actionNode') && (
        <>
          <div className="form-group">
            <label>Inputs (comma-separated):</label>
            <input 
              type="text" 
              value={nodeInputs} 
              onChange={(e) => setNodeInputs(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label>Outputs (comma-separated):</label>
            <input 
              type="text" 
              value={nodeOutputs} 
              onChange={(e) => setNodeOutputs(e.target.value)} 
            />
          </div>
        </>
      )}
      
      <button onClick={handleUpdate}>Update Node</button>
    </div>
  );
};

// Main application component
const App = () => {
  const [dslContent, setDslContent] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [showNodeProps, setShowNodeProps] = useState(false);
  const reactFlowWrapper = useRef(null);
  
  // Helper function for Dagre layout
  const getLayoutedElements = (nodes, edges, options = {}) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const {
      direction = 'LR', // LR = left-to-right, TB = top-to-bottom
      nodeWidth = 250,
      nodeHeight = 120,
      nodeSeparation = 100,
      rankSeparation = 300,
      groupSpacing = { workflows: 0, actions: 1, entities: 2, roles: 3, data: 4 }
    } = options;
    
    // Set graph direction and constraints
    dagreGraph.setGraph({ 
      rankdir: direction,
      nodesep: nodeSeparation,
      ranksep: rankSeparation,
      marginx: 50,
      marginy: 50
    });
    
    // Prepare nodes for dagre
    nodes.forEach((node) => {
      // Determine node group for layering
      let rankGroup = 0;
      if (node.type === 'workflowNode') rankGroup = groupSpacing.workflows;
      else if (node.type === 'actionNode') rankGroup = groupSpacing.actions;
      else if (node.type === 'entityNode') rankGroup = groupSpacing.entities;
      else if (node.type === 'roleNode') rankGroup = groupSpacing.roles;
      else if (node.type === 'dataNode') rankGroup = groupSpacing.data;
      
      dagreGraph.setNode(node.id, { 
        width: nodeWidth, 
        height: nodeHeight,
        rank: rankGroup // Custom rank to ensure nodes are grouped by type
      });
    });
    
    // Add edges
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
    
    // Calculate layout
    dagre.layout(dagreGraph);
    
    // Apply layout positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2
        }
      };
    });
    
    return layoutedNodes;
  };
  
  // Parse DSL and create diagram with Dagre layout
  const parseDSL = useCallback((content) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a new parser and converter instance
      const parser = new FlowgoParser();
      const converter = new FlowgoDiagramConverter();
      
      const ast = parser.parse(content);
      const flowData = converter.astToFlow(ast);
      
      console.log('Parsed nodes:', flowData.nodes);
      console.log('Parsed edges:', flowData.edges);
      
      // Apply automatic layout with Dagre
      const layoutedNodes = getLayoutedElements(
        flowData.nodes, 
        flowData.edges,
        { 
          direction: 'LR',
          nodeSeparation: 100,
          rankSeparation: 250,
          nodeWidth: 220,
          nodeHeight: 120
        }
      );
      
      setNodes(layoutedNodes);
      setEdges(flowData.edges);
      setLoading(false);
      
      // Force a refresh after a short delay to ensure edges are displayed
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2 });
        }
      }, 100);
      
    } catch (err) {
      console.error("Parser error details:", err);
      setError(`Parsing error: ${err.message}`);
      setLoading(false);
    }
  }, [setNodes, setEdges, reactFlowInstance]);
  
  // Update DSL from diagram
  const updateDSLFromDiagram = useCallback(() => {
    try {
      const converter = new FlowgoDiagramConverter();
      const ast = converter.flowToAst({ nodes, edges });
      const dsl = converter.generateDSL(ast);
      setDslContent(dsl);
    } catch (err) {
      setError(`Error generating DSL: ${err.message}`);
    }
  }, [nodes, edges]);
  
  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setDslContent(content);
      parseDSL(content);
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };
  
  // Handle text input change
  const handleTextChange = (event) => {
    setDslContent(event.target.value);
  };
  
  // Handle parse button click
  const handleParseClick = () => {
    parseDSL(dslContent);
  };
  
  // Handle node click
  const onNodeClick = (_, node) => {
    setSelectedNode(node);
    setShowNodeProps(true);
  };
  
  // Handle node update
  const handleNodeUpdate = (nodeId, updatedData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: updatedData } : n));
    setShowNodeProps(false);
    setTimeout(() => updateDSLFromDiagram(), 100);
  };
  
  // Handle connecting nodes with improved edge styling
  const onConnect = useCallback((params) => {
    console.log('Connection attempt:', params);
    
    // Create a unique edge ID
    const edgeId = `edge_${params.source}_${params.target}_${Date.now()}`;
    
    // Determine edge type based on source/target handles
    const isDataFlow = 
      params.sourceHandle?.includes('data') || 
      params.targetHandle?.includes('data') ||
      params.source?.includes('data') ||
      params.target?.includes('data');
    
    // Create a new edge with arrows
    const newEdge = {
      ...params,
      id: edgeId,
      type: isDataFlow ? 'dataFlow' : 'default',
      label: isDataFlow ? 'data flow' : 'connects to',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20
      },
      style: { 
        strokeWidth: 2,
        stroke: isDataFlow ? '#ff6b6b' : '#4a3f9f',
        strokeDasharray: isDataFlow ? '5,5' : null
      }
    };
    
    console.log('New edge created:', newEdge);
    setEdges((eds) => addEdge(newEdge, eds));
    setTimeout(() => updateDSLFromDiagram(), 100);
  }, [setEdges, updateDSLFromDiagram]);
  
  // Handle node drag end
  const onNodeDragStop = () => {
    setTimeout(() => updateDSLFromDiagram(), 100);
  };
  
  // Handle download DSL
// Handle download DSL with comprehensive debugging
const handleDownloadDSL = () => {
  try {
    // Extensive logging of current diagram state
    console.log('Current Nodes:', nodes);
    console.log('Current Edges:', edges);

    // Validate diagram state
    if (nodes.length === 0) {
      setError('No nodes in the diagram. Cannot generate DSL.');
      return;
    }

    // Create a new converter instance
    const converter = new FlowgoDiagramConverter();
    
    // Log the full flow data being passed
    const flowData = { nodes, edges };
    console.log('Flow Data for DSL Generation:', flowData);

    // Convert flow data to AST
    const ast = converter.flowToAst(flowData);
    console.log('Generated AST:', ast);

    // Generate DSL from AST
    const latestDsl = converter.generateDSL(ast);
    
    // Extensive logging of generated DSL
    console.log('Generated DSL (Full Content):', latestDsl);
    console.log('DSL Length:', latestDsl.length);
    
    // Verify DSL content
    if (!latestDsl || latestDsl.trim() === '') {
      setError('Failed to generate valid DSL content');
      return;
    }
    
    // Create and trigger download
    const blob = new Blob([latestDsl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowgo_diagram.dsl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Update textarea with latest DSL
    setDslContent(latestDsl);
    
    // Clear any previous errors
    setError(null);
  } catch (err) {
    console.error('Comprehensive Download Error:', err);
    console.error('Error Details:', {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      errorMessage: err.message,
      errorStack: err.stack
    });
    
    setError(`Failed to generate DSL: ${err.message}`);
  }
};

  // Sample DSL content for testing
  const loadSampleDSL = () => {
    const sampleDSL = `// Role Definitions
role Editor {
  description: "A human role responsible for final review and editing of the compiled book.";
  type: Human;
}
role Author {
  description: "A human role responsible for providing and assembling initial documents.";
  type: Human;
}
// Action Definitions
action ReadTOC by Al (source: BookProject) {
  description: "Reads the table of contents from the provided book project.";
  outputs: [toc];
}
action CollectDocuments by role Author (documents: List<Document>) {
  description: "Collects many documents provided by the author.";
  outputs: [rawContent];
}
action AlRearrangeContent by Al (rawContent: List<Document>, toc: TableOfContents) {
  description: "Rearranges the collected documents according to the table of contents to form a coherent booklet draft.";
  outputs: [bookletDraft];
}
action AlEnhanceContent by Al (bookletDraft: Document) {
  description: "Enhances and refines the booklet draft, improving language, transitions, and overall coherence.";
  outputs: [finalBook];
}
action EditorReview by role Editor (book: Document) {
  description: "Allows an editor to review the final book for quality, coherence, and completeness.";
  outputs: [reviewStatus];
}
// Entity Definitions
entity Document {
  title: String;
  content: String;
}
entity TableOfContents {
  chapters: List<String>;
}
entity BookProject {
  documents: List<Document>;
  toc: TableOfContents;
}
// Workflow Definition
workflow CreateBook {
  // Assume a BookProject variable "proj" is provided as input.
  ReadTOC(source: proj);
  CollectDocuments(documents: proj.documents);
  AlRearrangeContent(rawContent: rawContent, toc: toc);
  AlEnhanceContent(bookletDraft: bookletDraft);
  EditorReview(book: finalBook);
}`;
    
    setDslContent(sampleDSL);
    parseDSL(sampleDSL);
  };

  // Function to re-layout the diagram
  const handleRelayout = () => {
    if (nodes.length === 0) return;
    
    const layoutedNodes = getLayoutedElements(
      nodes, 
      edges,
      { 
        direction: 'LR',
        nodeSeparation: 100,
        rankSeparation: 250,
        nodeWidth: 220,
        nodeHeight: 120
      }
    );
    
    setNodes(layoutedNodes);
    
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 100);
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Flowgo Thaqi</h1>
      </header>
      
      <div className="main-content">
        <div className="side-panel">
          <div className="file-upload">
            <h2>Upload Flowgo DSL File</h2>
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept=".txt,.dsl,.flowgo" 
            />
          </div>
          
          <div className="text-input">
            <h2>DSL Content</h2>
            <textarea 
              value={dslContent} 
              onChange={handleTextChange} 
              placeholder="Enter Flowgo DSL content here..." 
              rows={15}
            />
            <div className="button-group">
              <button onClick={handleParseClick} disabled={!dslContent || loading}>
                {loading ? 'Parsing...' : 'Parse DSL'}
              </button>
              <button onClick={handleDownloadDSL} disabled={!nodes.length}>
                Download DSL
              </button>
              <button onClick={loadSampleDSL}>
                Load Sample
              </button>
              <button onClick={handleRelayout} disabled={!nodes.length}>
                Re-layout Diagram
              </button>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {showNodeProps && selectedNode && (
            <NodePropertiesForm 
              selectedNode={selectedNode} 
              onUpdate={handleNodeUpdate} 
            />
          )}
        </div>
        
        <div className="diagram-panel" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultMarkerEnd={{ type: MarkerType.ArrowClosed }}
            fitView
            attributionPosition="bottom-right"
            defaultZoom={0.8}
            minZoom={0.2}
            maxZoom={2}
            connectOnClick={false}
          >
            <Controls />
            <MiniMap 
              nodeStrokeColor={(n) => {
                if (n.type === 'actionNode') return '#0041d0';
                if (n.type === 'entityNode') return '#00a100';
                if (n.type === 'roleNode') return '#ff9900';
                return '#ff0072';
              }}
              nodeColor={(n) => {
                if (n.type === 'actionNode') return '#e3f2fd';
                if (n.type === 'entityNode') return '#e8f5e9';
                if (n.type === 'roleNode') return '#fff3e0';
                if (n.type === 'workflowNode') return '#f3e5f5';
                return '#ffebee';
              }}
            />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="bottom-right">
              <div className="flow-instructions">
                <p><strong>Instructions:</strong></p>
                <ul>
                  <li>Click on a node to edit properties</li>
                  <li>Drag to move nodes</li>
                  <li>Connect nodes by dragging from one handle to another</li>
                  <li>Click "Download DSL" to save your changes</li>
                  <li>Click "Re-layout Diagram" to organize the nodes</li>
                </ul>
              </div>
            </Panel>
            <Panel position="middle-right">
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color workflow-color"></div>
                  <span>Workflow</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color action-color"></div>
                  <span>Action</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color entity-color"></div>
                  <span>Entity</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color role-color"></div>
                  <span>Role</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color data-color"></div>
                  <span>Data</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default App;