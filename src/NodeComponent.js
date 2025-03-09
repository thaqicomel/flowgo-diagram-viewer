import React from 'react';
import { Handle } from 'reactflow';

// Custom ActionNode with explicit handles
export const ActionNode = ({ data, isConnectable }) => (
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
export const EntityNode = ({ data, isConnectable }) => (
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
export const RoleNode = ({ data, isConnectable }) => (
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
export const WorkflowNode = ({ data, isConnectable }) => (
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
export const DataNode = ({ data, isConnectable }) => (
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

// Export all node types
export const nodeTypes = {
  actionNode: ActionNode,
  entityNode: EntityNode,
  roleNode: RoleNode,
  workflowNode: WorkflowNode,
  dataNode: DataNode
};