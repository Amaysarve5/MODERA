import React, { useContext } from 'react'
import { ShopContext } from '../Context/ShopContext'
import { useParams } from 'react-router-dom';
import BreadCrum from '../Components/Breadcrums/BreadCrum';
import ProductDisplay from '../Components/ProductDisplay/ProductDisplay';
import DiscriptionBox from '../Components/DiscriptionBox/DiscriptionBox';
import RelatedProduct from '../Components/RelatedProducts/RelatedProduct';

const Product = () => {
  const {all_product} = useContext(ShopContext);
  const {ProductId} = useParams();
  const product = all_product.find((e) => e.id === Number(ProductId));
  return (
    <div>
      <BreadCrum product={product} />
      <ProductDisplay product={product}/>
      <DiscriptionBox />
      <RelatedProduct />
    </div>
  )
}

export default Product
