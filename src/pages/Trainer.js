import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';

const Trainer = () => {
  const [status, setStatus] = useState("1. Upload your insurancedataset.csv");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: async (results) => {
        const data = results.data.filter(r => r['sssyName.stateName'] && r['cropName'] && r['premiumRate']);
        setStatus("2. AI is studying ALL crops in your CSV... wait 15 seconds.");

        // --- DYNAMIC CROP LOADING ---
        const uniqueStates = [...new Set(data.map(item => item['sssyName.stateName']))];
        const uniqueCrops = [...new Set(data.map(item => item['cropName']))];

        // Save these lists to browser memory so Dashboard can see them
        localStorage.setItem('ai_states', JSON.stringify(uniqueStates));
        localStorage.setItem('ai_crops', JSON.stringify(uniqueCrops));

        const inputs = data.map(row => [
          uniqueStates.indexOf(row['sssyName.stateName']),
          uniqueCrops.indexOf(row['cropName'])
        ]);
        const outputs = data.map(row => row['premiumRate']);

        const inputTensor = tf.tensor2d(inputs);
        const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);

        const model = tf.sequential();
        model.add(tf.layers.dense({ inputShape: [2], units: 16, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1 }));

        model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
        await model.fit(inputTensor, outputTensor, { epochs: 25 });

        setStatus(`Success! Found ${uniqueCrops.length} crops. Move the 2 downloaded files to 'public' folder.`);
        await model.save('downloads://crop-premium-model');
      }
    });
  };

  return (
    <div style={{padding: '100px', textAlign: 'center', background: '#fff', height: '100vh'}}>
      <h1 style={{color: '#2e7d32'}}>AI Multi-Crop Trainer</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} style={{padding: '20px', border: '2px dashed #2e7d32'}} />
      <p style={{marginTop: '20px', fontSize: '20px', fontWeight: 'bold', color: '#d32f2f'}}>{status}</p>
    </div>
  );
};

export default Trainer;