const fs = require('fs');
const path = require('path');

const modelPath = path.join(__dirname, '..', 'public', 'ml', 'model.json');

console.log('Reading model.json...');
const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));

// Navigate to the layers
const layers = modelData.modelTopology?.model_config?.config?.layers;

if (!layers) {
  console.error('Could not find layers in model.json');
  process.exit(1);
}

console.log(`Found ${layers.length} layers`);

// Fix the InputLayer
const inputLayer = layers[0];
if (inputLayer.class_name === 'InputLayer') {
  const config = inputLayer.config;
  
  console.log('Current InputLayer config:', JSON.stringify(config, null, 2));
  
  // Rename batch_shape to batch_input_shape
  if (config.batch_shape && !config.batch_input_shape) {
    config.batch_input_shape = config.batch_shape;
    delete config.batch_shape;
    console.log('✅ Renamed batch_shape to batch_input_shape');
  }
  
  // Also add inputShape as fallback
  if (config.batch_input_shape && !config.inputShape) {
    config.inputShape = config.batch_input_shape.slice(1); // Remove batch dimension
    console.log('✅ Added inputShape:', config.inputShape);
  }
  
  // Remove problematic fields
  delete config.optional;
  delete config.ragged;
  
  console.log('Fixed InputLayer config:', JSON.stringify(config, null, 2));
}

// Also fix dtype issues in all layers (Keras 3 format not compatible)
for (const layer of layers) {
  if (layer.config && typeof layer.config.dtype === 'object') {
    layer.config.dtype = 'float32';
  }
  
  // Fix initializers
  if (layer.config) {
    for (const key of Object.keys(layer.config)) {
      const val = layer.config[key];
      if (val && typeof val === 'object' && val.module) {
        // Convert Keras 3 initializer format to simple format
        if (val.class_name) {
          layer.config[key] = {
            class_name: val.class_name,
            config: val.config || {}
          };
        }
      }
    }
  }
}

// Write fixed model.json
fs.writeFileSync(modelPath, JSON.stringify(modelData));
console.log('✅ Saved fixed model.json');

// Verify
const verified = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
const verifiedInput = verified.modelTopology?.model_config?.config?.layers?.[0];
console.log('\nVerification:');
console.log('  batch_input_shape:', verifiedInput?.config?.batch_input_shape);
console.log('  inputShape:', verifiedInput?.config?.inputShape);