import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { NFTStorage, File } from "nft.storage";
import axios from "axios";
import { Buffer } from "buffer";
import { abi, contractAddresses } from "./constants";
// Components
import Spinner from "react-bootstrap/Spinner";
import Navigation from "./components/Navigation";
const App = () => {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [url, setURL] = useState(null);
  const [nft, setNFT] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);

  const loadBlockchainData = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);
    const network = await provider.getNetwork();
    const nftAddress =
      network.chainId in contractAddresses
        ? contractAddresses[network.chainId][0]
        : null;
    const NFT = new ethers.Contract(nftAddress, abi, provider);
    setNFT(NFT);
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);
    // Call AI API to generate a image based on description
    const imageData = await createImage();

    // Upload image to IPFS (NFT.Storage)
    const imgurl = await uploadImage(imageData);

    // Mint NFT
    await mintImage(imgurl);
    setMessage("Success!!");
    setIsWaiting(false);
  };

  const createImage = async () => {
    setMessage("Creating image...");

    // You can replace this with different model API's
    const URL = `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2`;

    const response = await axios({
      url: URL,
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        inputs: description,
        options: { wait_for_model: true },
      }),
      responseType: "arraybuffer",
    });

    const type = response.headers["content-type"];
    const data = response.data;

    const base64data = Buffer.from(data).toString("base64");
    const img = `data:${type};base64,` + base64data; // <-- This is so we can render it on the page
    setImage(img);
    return data;
  };

  const uploadImage = async (imageData) => {
    setMessage("Uploading Image...");

    // Create a instance of NFTStorage
    const nftStorage = new NFTStorage({
      token: process.env.REACT_APP_NFT_STORAGE_API_KEY,
    });

    // Send request to store Image
    const { ipnft } = await nftStorage.store({
      image: new File([imageData], "image.jpeg", { type: "image/jpeg" }),
      name: name,
      description: description,
    });

    // save the URL
    const iurl = `https://ipfs.io/ipfs/${ipnft}/metadata.json`;
    setURL(iurl);
    return iurl;
  };

  const mintImage = async (tokenURI) => {
    setMessage("Waiting for mint...");

    const signer = await provider.getSigner();
    const transaction = await nft
      .connect(signer)
      .mint(tokenURI, { value: ethers.parseEther("0.0001") });
    await transaction.wait();
  };

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <div className="form">
        <form onSubmit={submitHandler}>
          <input
            type="text"
            placeholder="Create a Name..."
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          ></input>
          <input
            type="text"
            placeholder="Create a description..."
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            required
          ></input>
          <input type="submit" value="Create & Mint"></input>
        </form>
        <div className="image">
          {!isWaiting && image ? (
            <img src={image} alt="AI-Generated Image" />
          ) : isWaiting ? (
            <div className="image__placeholder">
              <Spinner animation="grow" variant="secondary" />
              <p>{message}</p>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      {!isWaiting && url && (
        <p>
          View&nbsp;<a href={url}>Metadata</a>
        </p>
      )}
    </div>
  );
};
export default App;
