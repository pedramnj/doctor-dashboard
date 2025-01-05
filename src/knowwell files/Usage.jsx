import {
    FocusContext,
    useFocusable,
  } from "@noriginmedia/norigin-spatial-navigation";
  import { ref as FBref, getDownloadURL } from "firebase/storage";
  import React, { useEffect, useState } from "react";
  import { Col, Row } from "react-bootstrap";
  import { FaPills } from "react-icons/fa";
  import { storage } from "../../Firebase";
  import { focusKeys } from "./DrugDetails";
  
  const Usage = ({ knowledgeLevel, drug, focusKey }) => {
    const { ref, focused, focusSelf } = useFocusable({
      focusKey,
    });
    const [transformedDrug, setTransformedDrug] = useState();
  
    const getAssetURL = async (src) => {
      try {
        const assetRef = FBref(storage, src);
        const url = await getDownloadURL(assetRef);
        return url;
      } catch (error) {
        console.error("Error getting asset URL:", error);
        return src;
      }
    };
  
    useEffect(() => {
      const transformDrug = async () => {
        try {
          console.log("Current drug data:", drug);
          console.log("Current knowledge level:", knowledgeLevel);
  
          let levelContent = [];
          const level = knowledgeLevel.charAt(0).toUpperCase() + knowledgeLevel.slice(1);
  
          if (drug.Details?.[level] && Array.isArray(drug.Details[level])) {
            console.log(`Found content in Details.${level}:`, drug.Details[level]);
            
            levelContent = drug.Details[level].reduce((acc, section) => {
              if (section && Array.isArray(section.Content)) {
                return [...acc, ...section.Content];
              }
              return acc;
            }, []);
          }
  
          console.log(`Content found for ${level}:`, levelContent);
  
          if (levelContent.length > 0) {
            const transformedContent = await Promise.all(
              levelContent.map(async (item) => {
                if (!item) return null;
                
                try {
                  if (
                    typeof item === 'string' && 
                    (item.includes(".mp4") ||
                     item.includes(".jpg") ||
                     item.includes(".png") ||
                     item.includes(".gif") ||
                     item.includes(".webp") ||
                     item.includes(".jpeg"))
                  ) {
                    return await getAssetURL(item);
                  }
                  return item;
                } catch (error) {
                  console.error("Error transforming item:", error);
                  return item;
                }
              })
            );
  
            const cleanedContent = transformedContent.filter(item => item != null);
            console.log("Transformed and cleaned content:", cleanedContent);
  
            // Store the content directly in the transformed drug
            setTransformedDrug({
              ...drug,
              transformedContent: cleanedContent
            });
          }
        } catch (error) {
          console.error("Error in transformDrug:", error);
          setTransformedDrug(drug);
        }
      };
  
      if (drug) {
        transformDrug();
      }
    }, [drug, knowledgeLevel]);
  
    if (!transformedDrug) {
      return <p>Loading...</p>;
    }
  
    return (
      <FocusContext.Provider value={focusKey}>
        <div
          className={`text-white p-2 rounded-lg ${
            focused ? "border border-4 border-green bg-gray-500" : "bg-gray-700"
          }`}
          ref={ref}
          onFocus={focusSelf}
        >
          <div className="mt-4">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center">
                How to use it <FaPills className="ml-2" />
              </h3>
              <div className="m-2 p-2">
                <Content 
                  transformedDrug={transformedDrug}
                  focusKey={focusKeys.DRUG_USAGE_P1}
                />
              </div>
            </div>
          </div>
        </div>
      </FocusContext.Provider>
    );
  };
  
  const Content = ({ transformedDrug, focusKey }) => {
    const { ref, focused } = useFocusable({
      focusKey,
    });
  
    if (!transformedDrug.transformedContent || transformedDrug.transformedContent.length === 0) {
      return <p>No content available for this knowledge level.</p>;
    }
  
    return (
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref}
          className={`${focused ? "border border-2 border-blue" : ""}`}
        >
          {transformedDrug.transformedContent.map((item, index) =>
            item.includes(".mp4") ? (
              <VideoItem
                key={index}
                src={item}
                alt={transformedDrug.DrugTitle}
                focusKey={`DRUG_CONTENT_VIDEO_${index}`}
              />
            ) : item.includes(".jpg") ||
              item.includes(".png") ||
              item.includes(".gif") ||
              item.includes(".webp") ||
              item.includes(".jpeg") ? (
              <ImageItem
                key={index}
                src={item}
                alt={transformedDrug.DrugTitle}
                focusKey={`DRUG_CONTENT_IMAGE_${index}`}
              />
            ) : (
              <p className="m-1 p-1" key={index}>
                {item}
              </p>
            )
          )}
        </div>
      </FocusContext.Provider>
    );
  };
  
  const ImageItem = ({ src, alt, focusKey }) => {
    const { ref, focused } = useFocusable({
      focusKey,
    });
  
    return (
      <FocusContext.Provider value={focusKey}>
        <img
          ref={ref}
          className={`img-fluid mx-2 ${
            focused ? "border border-4 border-success bg-light" : "bg-light"
          }`}
          src={src}
          alt={alt}
          width={500}
          height={500}
        />
      </FocusContext.Provider>
    );
  };
  
  const VideoItem = ({ src, alt, focusKey }) => {
    const { ref, focused } = useFocusable({
      focusKey,
      onEnterPress: () => {
        if (ref.current) {
          ref.current.play();
        }
      },
    });
  
    return (
      <FocusContext.Provider value={focusKey}>
        <video
          ref={ref}
          className={`img-fluid m-2 ${
            focused ? "border border-4 border-success bg-light" : "bg-light"
          }`}
          src={src}
          alt={alt}
          controls
          width={500}
          height={500}
        ></video>
      </FocusContext.Provider>
    );
  };
  
  export default Usage;
  