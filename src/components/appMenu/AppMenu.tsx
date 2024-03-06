import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, NavLink } from 'react-router-dom';
import styles from './AppMenu.module.scss';
import { Pane } from '@cybercongress/gravity';
import cx from 'classnames';
import { MenuItem, MenuItems } from 'src/containers/application/AppMenu';

interface Props {
  item: MenuItem | MenuItem['subItems'][0];
  selected: boolean;
  onClick: () => void;
}

function Items({ item, selected, onClick }: Props) {
  return (
    <NavLink
      to={item.to}
      className={() => {
        return cx(styles.bookmarks__item, { [styles.active]: selected });
      }}
      onClick={onClick}
    >
      <Pane display="flex" paddingY={5} alignItems="center" key={item.name}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '30px 1fr',
            gap: 10,
            alignItems: 'center',
            paddingLeft: 15,
          }}
        >
          {item.icon && (
            <img
              src={item.icon}
              style={{ width: 30, height: 30, objectFit: 'contain' }}
              alt="img"
            />
          )}
          <Pane
            alignItems="center"
            whiteSpace="nowrap"
            flexGrow={1}
            fontSize={18}
            display="flex"
          >
            {item.name}
          </Pane>
        </div>
      </Pane>
    </NavLink>
  );
}

export const renderSubItems = (
  subItems: MenuItem['subItems'],
  location,
  onClickSubItem
) => {
  return subItems.map((itemSub) => {
    const onClickFuc = () => {
      onClickSubItem && onClickSubItem(itemSub.name);
    };
    return (
      <Items
        selected={itemSub.to === location.pathname}
        key={itemSub.name}
        item={itemSub}
        onClick={onClickFuc}
      />
    );
  });
};

// eslint-disable-next-line import/prefer-default-export
export function Bookmarks({
  items,
  closeMenu,
  setActiveApp,
}: {
  items: MenuItems;
  closeMenu: () => void;
  setActiveApp: React.Dispatch<
    React.SetStateAction<{
      icon: undefined | string;
      subItems: any[] | undefined;
    }>
  >;
}) {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedItemSub, setSelectedItemSub] = useState<string>('');
  const location = useLocation();

  function onClickItem(itemKey: MenuItem['name']) {
    setSelectedItem(itemKey);
    setSelectedItemSub('');

    const item = items.find((item) => item.name === itemKey);
    setActiveApp({
      subItems: item?.subItems,
      icon: item?.icon,
    });

    closeMenu();

    // if (item && item.subItems.length === 0) {
    //   closeMenu();
    // }
  }

  // useEffect(() => {
  //   const item = items.find((item) => {
  //     if (
  //       location.pathname.includes('@') ||
  //       location.pathname.includes('neuron/')
  //     ) {
  //       return item.to === '/robot';
  //     }
  //     return item.to === location.pathname;
  //   });

  //   console.log('item', item);

  //   setActiveApp({
  //     subItems: item?.subItems,
  //     icon: item?.icon,
  //   });
  // }, [location, JSON.stringify(items), setActiveApp]);

  function onClickSubItem(itemKey: string) {
    setSelectedItemSub(itemKey);
    closeMenu();
  }

  useEffect(() => {
    setSelectedItemSub('');
  }, [selectedItem]);

  return (
    <div className={styles.bookmarks}>
      {items.map((item) => {
        const key = uuidv4();
        return (
          <div key={key}>
            <Items
              selected={
                (item.to === location.pathname && selectedItemSub === '') ||
                // maybe refactor robot url check
                (item.to === '/robot' &&
                  (location.pathname.includes('@') ||
                    location.pathname.includes('neuron/')))
                // item.active === undefined
              }
              item={item}
              onClick={() => onClickItem(item.name)}
            />
            {/* {item.name === selectedItem && (
              <Pane paddingLeft={50}>
                {renderSubItems(item.subItems, location, onClickSubItem)}
              </Pane>
            )} */}
          </div>
        );
      })}
    </div>
  );
}
