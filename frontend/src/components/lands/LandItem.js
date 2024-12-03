import React, { useState } from 'react';
import LandForm from './LandForm';

const LandItem = ({ land, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <LandForm land={land} setIsEditing={setIsEditing} />;
  }

  return (
    <div className="land-item">
      <h3>{land.name}</h3>
      <p>Size: {land.size} {land.unit}</p>
      <p>Category: {land.category}</p>
      <p>Ownership: {land.ownership}</p>
      <p>Location: {land.location}</p>
      {land.description && <p>Description: {land.description}</p>}
      
      <div className="actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

export default LandItem; 