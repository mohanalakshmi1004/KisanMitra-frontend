import * as tf from '@tensorflow/tfjs';

export const identifyDisease = async (imageElement) => {
  try {
    
    if (!model) {
      model = await tf.loadLayersModel('/model/model.json');
    }
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224]) 
      .toFloat()
      .div(tf.scalar(255.0)) 
      .expandDims();

   
    const predictions = await model.predict(tensor).data();
    
    
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    
    
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


const getDynamicTreatment = (diseaseName) => {
  const manual = {
    "Rice Leaf Blast": "Spray Tricyclazole 75% WP. Avoid excessive nitrogen.",
    "Brown Leaf Rust": "Apply Propiconazole 25% EC. Ensure proper spacing.",
    "Healthy": "Keep monitoring. Ensure regular irrigation."
  };
  return manual[diseaseName] || "Consult an agricultural expert.";
};