import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLand } from '../../features/lands/landSlice';
import LandItem from './LandItem';

const LandList = () => {
  const dispatch = useDispatch();
  const { lands, isLoading } = useSelector((state) => state.lands);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="land-list">
      {lands.length > 0 ? (
        lands.map((land) => (
          <LandItem
            key={land._id}
            land={land}
            onDelete={() => dispatch(deleteLand(land._id))}
          />
        ))
      ) : (
        <p>No lands found</p>
      )}
    </div>
  );
};

export default LandList; 