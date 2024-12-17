import React, { useState } from 'react';
import LandForm from './LandForm';

const LandItem = ({ land, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <LandForm land={land} setIsEditing={setIsEditing} />;
  }

  return (
    <div className="land-item">
      <h3>{land.parcel_number}</h3>
      <p>Size: {land.area} {land.area_unit}</p>
      <p>Forest Type: {land.forest_type}</p>
      <p>Soil Type: {land.soil_type}</p>
      <p>Location: {land.location}</p>
      {land.notes && <p>Notes: {land.notes}</p>}
      
      <div className="actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

export default LandItem; 