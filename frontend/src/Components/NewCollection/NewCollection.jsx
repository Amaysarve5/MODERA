import React, { useEffect, useState } from 'react';
import './NewCollection.css';
import Item from '../Items/Item';

const NewCollection = () => {
  const [new_Collection, setNew_Collection] = useState([]);
  const backendURL = process.env.REACT_APP_API_URL; // ✅ Use correct env variable

  useEffect(() => {
    fetch(`${backendURL}/newcollection`)
      .then((response) => response.json())
      .then((data) => setNew_Collection(data));
  }, [backendURL]);

  return (
    <div className='new-collection'>
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
        {new_Collection.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default NewCollection;
