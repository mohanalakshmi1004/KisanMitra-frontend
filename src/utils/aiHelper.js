import * as tf from '@tensorflow/tfjs';

// Global variable to hold the model in memory
let model;

export const identifyDisease = async (imageElement) => {
  try {
    // 1. Load the Neural Network (The Brain)
    // You can host this on your own server or use a Teachable Machine link
    if (!model) {
      model = await tf.loadLayersModel('/model/model.json');
    }

    // 

    // 2. Pre-processing (Preparing the pixels for the AI)
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224]) // Match the model's input size
      .toFloat()
      .div(tf.scalar(255.0)) // Normalize values to 0-1 range
      .expandDims();

    // 3. THE PREDICTION (Real ML Inference)
    const predictions = await model.predict(tensor).data();
    
    // 4. Find the result with the highest probability
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    
    // These classes should match exactly how you trained your model
    const classes = ["Healthy", "Rice Leaf Blast", "Brown Leaf Rust"];
    const confidence = (predictions[maxIndex] * 100).toFixed(1) + "%";

    return {
      status: classes[maxIndex] === "Healthy" ? "Healthy" : "Infected",
      disease: classes[maxIndex],
      confidence: confidence,
      treatment: getDynamicTreatment(classes[maxIndex])
    };

  } catch (error) {
    console.error("Inference Error:", error);
    return null;
  }
};

// Simple lookup for treatments based on the ML result
const getDynamicTreatment = (diseaseName) => {
  const manual = {
    "Rice Leaf Blast": "Spray Tricyclazole 75% WP. Avoid excessive nitrogen.",
    "Brown Leaf Rust": "Apply Propiconazole 25% EC. Ensure proper spacing.",
    "Healthy": "Keep monitoring. Ensure regular irrigation."
  };
  return manual[diseaseName] || "Consult an agricultural expert.";
};