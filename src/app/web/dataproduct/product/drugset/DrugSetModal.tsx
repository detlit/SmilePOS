'use client'

import React from 'react'
import Modal from 'react-bootstrap/Modal'
import DrugSetPage from './DrugSetPage'

type DrugSetModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function DrugSetModal({ isOpen, onClose }: DrugSetModalProps) {
  return (
    <>
      <Modal
        show={isOpen}
        onHide={onClose}
        size="xl"
        fullscreen="lg-down"
        centered
        dialogClassName="drug-set-modal-dialog"
        contentClassName="drug-set-modal-content"
      >
        <Modal.Body style={{ padding: 0, background: '#f8fafc', overflow: 'hidden' }}>
          <DrugSetPage isModal onClose={onClose} />
        </Modal.Body>
      </Modal>
      <style>{`
        .drug-set-modal-dialog {
          max-width: min(96vw, 1480px);
        }

        .drug-set-modal-content {
          border: 0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
        }
      `}</style>
    </>
  )
}