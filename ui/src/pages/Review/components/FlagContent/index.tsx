import { FC, useEffect, useState } from 'react';
import { Card, Alert, Stack, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import classNames from 'classnames';

import { getFlagReviewPostList, putFlagReviewAction } from '@/services';
import { BaseUserCard, Tag, FormatTime } from '@/components';
import { scrollToDocTop } from '@/utils';
import type * as Type from '@/common/interface';
import { ADMIN_LIST_STATUS } from '@/common/constants';
import ApproveDropdown from '../ApproveDropdown';
import generateData from '../../utils/generateData';

interface IProps {
  refreshCount: () => void;
}

const Index: FC<IProps> = ({ refreshCount }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'page_review' });
  const [noTasks, setNoTasks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [reviewResp, setReviewResp] = useState<Type.FlagReviewResp>();
  const flagItemData = reviewResp?.list[0] as Type.FlagReviewItem;

  // console.log('reviewResp', reviewResp);

  const resolveNextOne = (resp, pageNumber) => {
    const { count, list = [] } = resp;
    // auto rollback
    if (!list.length && count && page !== 1) {
      pageNumber = 1;
      setPage(pageNumber);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      queryNextOne(pageNumber);
      return;
    }
    if (pageNumber !== page) {
      setPage(pageNumber);
    }
    setReviewResp(resp);
    if (!list.length) {
      setNoTasks(true);
    }
    setTimeout(() => {
      scrollToDocTop();
    }, 150);
  };

  const queryNextOne = (pageNumber) => {
    getFlagReviewPostList(pageNumber)
      .then((resp) => {
        resolveNextOne(resp, pageNumber);
      })
      .catch((ex) => {
        console.error('review next error: ', ex);
      });
  };

  useEffect(() => {
    queryNextOne(page);
  }, []);

  const handlingApprove = () => {
    if (!flagItemData) {
      return;
    }
    refreshCount();
    queryNextOne(page);
  };

  const handleIgnore = () => {
    setIsLoading(true);
    putFlagReviewAction({
      operation_type: 'ignore_report',
      flag_id: String(flagItemData?.flag_id),
    })
      .then(() => {
        refreshCount();
        queryNextOne(page);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const {
    object_type,
    submitter_user,
    author_user_info,
    object_status,
    reason,
  } = flagItemData || {
    object_type: '',
    submitter_user: null,
    author_user_info: null,
    reason: null,
    object_status: 0,
  };

  const { itemLink, itemId, itemTimePrefix } = generateData(flagItemData);

  if (noTasks) return null;
  return (
    <Card>
      <Card.Header>
        {object_type !== 'user' ? t('flag_post') : t('flag_user')}
      </Card.Header>
      <Card.Body className="p-0">
        <Alert variant="info" className="border-0 rounded-0 mb-0">
          <Stack
            direction="horizontal"
            gap={1}
            className="align-items-center mb-2">
            <BaseUserCard data={submitter_user} avatarSize="24" />
            {flagItemData?.submit_at && (
              <FormatTime
                time={flagItemData.submit_at}
                className="small text-secondary"
                preFix={t('proposed')}
              />
            )}
          </Stack>
          <Stack className="align-items-start">
            <p className="mb-0">
              {object_type !== 'user'
                ? t('flag_post_type', { type: reason?.name })
                : t('flag_user_type', { type: reason?.name })}
            </p>
          </Stack>
        </Alert>
        <div className="p-3">
          <small className="d-block text-secondary mb-4">
            <span>{t(object_type, { keyPrefix: 'btns' })} </span>
            <Link to={itemLink} target="_blank" className="link-secondary">
              #{itemId}
            </Link>
          </small>
          {object_type === 'question' && (
            <>
              <h5 className="mb-3">{flagItemData?.title}</h5>
              <div className="mb-4">
                {flagItemData?.tags?.map((item) => {
                  return (
                    <Tag key={item.slug_name} className="me-1" data={item} />
                  );
                })}
              </div>
            </>
          )}
          <div className="small font-monospace">
            {flagItemData?.original_text}
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-between mt-4">
            <div>
              <span
                className={classNames(
                  'badge',
                  ADMIN_LIST_STATUS[object_status]?.variant,
                )}>
                {t(ADMIN_LIST_STATUS[object_status]?.name, {
                  keyPrefix: 'btns',
                })}
              </span>
              {flagItemData?.object_show_status === 2 && (
                <span
                  className={classNames(
                    'ms-1 badge',
                    ADMIN_LIST_STATUS.unlist.variant,
                  )}>
                  {t(ADMIN_LIST_STATUS.unlist.name, { keyPrefix: 'btns' })}
                </span>
              )}
            </div>
            <div className="d-flex align-items-center small">
              <BaseUserCard data={author_user_info} avatarSize="24" />
              <FormatTime
                time={Number(flagItemData?.created_at)}
                className="text-secondary ms-1 flex-shrink-0"
                preFix={t(itemTimePrefix, { keyPrefix: 'question_detail' })}
              />
            </div>
          </div>
        </div>
      </Card.Body>

      <Card.Footer className="p-3">
        <p>{t('approve_flag_tip')}</p>
        <Stack direction="horizontal" gap={2}>
          <ApproveDropdown
            objectType={object_type}
            itemData={flagItemData}
            curFilter={ADMIN_LIST_STATUS[object_status]?.name}
            approveCallback={handlingApprove}
          />
          <Button
            variant="outline-primary"
            disabled={isLoading}
            onClick={handleIgnore}>
            {t('ignore', { keyPrefix: 'btns' })}
          </Button>
        </Stack>
      </Card.Footer>
    </Card>
  );
};

export default Index;