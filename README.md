# Flowgo v1b Diagram Viewer

## Project Overview

This prototype is a web-based application for visualizing workflows defined in the Flowgo v1b Domain-Specific Language (DSL). The application allows users to upload a Flowgo DSL file and generate an interactive, comprehensive diagram that represents the workflow's structure, including actions, entities, roles, and their interactions.

## Design and Implementation Choices

### Technology Stack
- **Frontend**: React.js
- **Diagram Visualization**: ReactFlow
- **Layout Algorithm**: Dagre.js
- **Parsing**: Custom-built parser using JavaScript

### Key Implementation Decisions
1. **Custom Parser**: Developed a robust parser that can handle the full Flowgo v1b language specification, including:
   - Actions performed by AI or human agents
   - Entity definitions
   - Workflow sequences
   - Role specifications
   - Conditional logic

2. **Interactive Diagram**:
   - Used ReactFlow for flexible, interactive node-based visualization
   - Implemented custom node types for different elements (actions, entities, roles)
   - Added bi-directional editing capabilities
   - Supported automatic layout and manual node positioning

3. **State Management**:
   - Utilized React hooks for efficient state management
   - Implemented conversion between diagram state and DSL script

## Local Setup and Installation

### Prerequisites
- Node.js (v16 or later)
- npm (v8 or later)

### Installation Steps
1. Clone the repository
```bash
git clone https://github.com/thaqicomel/flowgo-diagram-viewer.git
cd flowgo-diagram-viewer
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open the application
- Navigate to `http://localhost:3000`
- Upload a Flowgo DSL file to generate a diagram
- You may use the test.txt

## Known Limitations and Improvement Areas

### Current Limitations
1. **Parsing Complexity**
   - Limited handling of extremely complex nested workflows
   - Potential edge cases in DSL parsing may not be fully covered

2. **Performance**
   - Large DSL files might impact rendering performance
   - Limited optimization for extensive workflow diagrams

3. **Error Handling**
   - Basic error messaging for DSL parsing
   - Lack of comprehensive validation for all possible DSL variations

### Potential Improvements
1. **Enhanced Parsing**
   - More robust error detection and reporting
   - Support for more complex language constructs
   - Improved type checking and validation

2. **Diagram Capabilities**
   - Advanced layout algorithms
   - More granular node and edge customization
   - Improved zoom and pan controls

3. **User Experience**
   - More intuitive editing interfaces
   - Drag-and-drop workflow modification
   - Real-time syntax validation

4. **Performance Optimization**
   - Implement lazy loading for large diagrams
   - Add virtualization for extensive workflows

## Testing

### Sample DSL
A sample Flowgo DSL script is included in the project documentation. Use this to test the application's capabilities.
