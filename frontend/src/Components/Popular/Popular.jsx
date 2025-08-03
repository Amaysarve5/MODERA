import React, { useEffect, useState } from 'react';
import './Popular.css';
import Item from '../Items/Item';

const Popular = () => {
  const [popularProducts, setpopularProducts] = useState([]);
  const backendURL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetch(`${backendURL}/popularinwomen`)
      .then((response) => response.json())
      .then((data) => setpopularProducts(data));
  }, [backendURL]);

  return (
    <div className='popular'>
      <h1>POPULAR IN WOMEN</h1>
      <hr />
      <div className="popular-item">
        {popularProducts.map((item, i) => (
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

export default Popular;
