import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';

const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'del', 'nothing', 'space'];

const confidenceThreshold = 0.5;

function IndianVideo() {
  const webcamRef = useRef(null);
  const videoConstraints = {
    width: 813,
    height: 396,
    facingMode: 'user',
  };
  const [bestPrediction, setBestPrediction] = useState({ label: 'Undeterminable', confidence: 0 });
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const model = await tf.loadGraphModel('/indian_model_js/model.json');
        setModelLoaded(true);

        async function predictFrame() {
          try {
            const webcam = webcamRef.current.video;
            const frame = tf.browser.fromPixels(webcam);
            const resizedFrame = tf.image.resizeBilinear(frame, [224, 224]);
            const frameWithRGB = tf.tidy(() => {
              if (resizedFrame.shape[2] === 3) {
                return resizedFrame;
              }
              return tf.concat([resizedFrame, resizedFrame, resizedFrame], 2);
            });

            const normalizedFrame = frameWithRGB.toFloat().div(tf.scalar(255.0));
            const inputTensor = normalizedFrame.reshape([-1, 224, 224, 3]);

            const prediction = model.predict(inputTensor);
            const predictionData = prediction.dataSync();

            const bestIndex = predictionData.indexOf(Math.max(...predictionData));
            const bestLabel = labels[bestIndex];
            const confidence = predictionData[bestIndex];

            if (confidence >= confidenceThreshold) {
              setBestPrediction({ label: bestLabel, confidence: confidence });
            } else {
              setBestPrediction({ label: 'Undeterminable', confidence: 0 });
            }

            frame.dispose();
            resizedFrame.dispose();
            frameWithRGB.dispose();
            normalizedFrame.dispose();
            prediction.dispose();

            setTimeout(predictFrame, 5000);
          } catch (error) {
            console.error('Error in predictFrame:', error);
          }

          requestAnimationFrame(predictFrame);
        }

        predictFrame();
      } catch (error) {
        console.error('Error loading the model:', error);
      }
    };

    loadModel();
  }, []);

  return (
    <div className="main">
      <div className="best-prediction">
        <p>
          Label: {bestPrediction.label}
          &nbsp;
          Confidence: {bestPrediction.confidence.toFixed(2)}
        </p>
      </div>
        <Webcam
          audio={false}
          className="video-element"
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          ref={webcamRef}
        />
      
    </div>
  );
}

export default IndianVideo;
